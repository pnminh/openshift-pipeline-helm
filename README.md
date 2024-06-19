Application lifecycle with Tekton and Helm Charts on OpenShift
----------------------------------------------------------------------------------

In this blog post, we will go through the full application lifecycle using Tekton and Helm charts. The journey starts with setting up the Tekton and then step-by-step configuration of Tekton to build and deploy an app to dev environment and then promote it to production one. To make it simple, we ues an example of a ToDo app and a single Openshift cluster for the whole process.

### Installation
Tekton is a powerful and flexible open-source framework for creating CI/CD systems, allowing developers to build, test, and deploy across cloud providers and on-premise systems. It’s designed to be container-native and is built on Kubernetes, making it a great choice for teams using any K8s distributions such as Openshift.
On Openshift, the easiest way to have Tekton installed is to install Openshift Pipelines Operator
```sh
cat <<EOF | oc apply -f -
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: openshift-pipelines-operator-rh
  namespace: openshift-operators
spec:
  channel: pipelines-1.14
  installPlanApproval: Automatic
  name: openshift-pipelines-operator-rh
  source: redhat-operators
  sourceNamespace: openshift-marketplace
EOF
```
The Operator does not only install Tekton resources but also provide us with an UI to configure the pipeline. We will focus on the command line for all of the remaining tasks instead.

### Build pipeline
For the build pipeline, we will take advantage of Openshift's BuildConfig with s2i image to create a deployable image at the end.
To achieve that we will utilize Helm chart which allows us to generate Openshift resources with customizable values.
```sh
cd helm && helm create build-app
```
The chart only needs to create a BuildConfig resource and then we can use tekton to run the build to bundle the application into an image. Create a template for the BuildConfig like so:
```yaml
kind: BuildConfig
apiVersion: build.openshift.io/v1
metadata:
  name: {{ .Release.Name }}
  labels:
    {{- include "build-app.labels" . | nindent 4 }}
spec:
  output:
    pushSecret:
      name: "{{ .Values.target.image.pushSecret }}"
    to:
      kind: DockerImage
      name: "{{ .Values.target.image.registry }}/{{ .Values.target.image.path }}:{{ .Values.target.image.tag | default "latest" }}"
  resources: {}
  successfulBuildsHistoryLimit: 5
  failedBuildsHistoryLimit: 5
  strategy:
    type: Binary
    sourceStrategy:
      from:
        kind: DockerImage
        name: "{{ .Values.source.image.repository }}:{{ .Values.source.image.tag | default .Chart.AppVersion }}"
  source:
    binary: {}
  runPolicy: Serial

```
On the tekton side, we will utilize 
### Deployment pipeline
#### 1\. Setting Up Tekton Pipelines

First, we need to set up Tekton Pipelines for our CI/CD workflow.

**Pipeline Definition:**

Create a `pipeline.yaml` file defining the pipeline with tasks for unit testing, static code analysis, building the Docker image, and deploying to different environments.

```yaml
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: todo-app-pipeline
spec:
  tasks:
    - name: unit-test
      taskRef:
        name: unit-test-task
    - name: static-code-analysis
      taskRef:
        name: static-code-analysis-task
    - name: build-image
      taskRef:
        name: build-image-task
    - name: deploy-dev
      taskRef:
        name: deploy-task
      runAfter:
        - build-image
      params:
        - name: environment
          value: dev
    - name: integration-test-dev
      taskRef:
        name: integration-test-task
      runAfter:
        - deploy-dev
      params:
        - name: environment
          value: dev
    - name: promote-stage
      taskRef:
        name: promote-image-task
      runAfter:
        - integration-test-dev
      params:
        - name: target
          value: stage
    - name: deploy-stage
      taskRef:
        name: deploy-task
      runAfter:
        - promote-stage
      params:
        - name: environment
          value: stage
    - name: integration-test-stage
      taskRef:
        name: integration-test-task
      runAfter:
        - deploy-stage
      params:
        - name: environment
          value: stage
    - name: promote-prod
      taskRef:
        name: promote-image-task
      runAfter:
        - integration-test-stage
      params:
        - name: target
          value: prod
    - name: deploy-prod
      taskRef:
        name: deploy-task
      runAfter:
        - promote-prod
      params:
        - name: environment
          value: prod
    - name: acceptance-test-prod
      taskRef:
        name: acceptance-test-task
      runAfter:
        - deploy-prod
      params:
        - name: environment
          value: prod`
```
#### 2\. Task Definitions

**Unit Test Task:**

Create a `unit-test-task.yaml` file for running unit tests.

```yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: unit-test-task
spec:
  steps:
    - name: run-unit-tests
      image: node:14
      script: |
        npm install
        npm run test `
```

**Static Code Analysis Task:**

Create a `static-code-analysis-task.yaml` file for performing static code analysis.

```yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: static-code-analysis-task
spec:
  steps:
    - name: run-linter
      image: node:14
      script: |
        npm install
        npm run lint 
```

**Build Image Task:**

Create a `build-image-task.yaml` file to build the Docker image.

```yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: build-image-task
spec:
  steps:
    - name: build-and-push
      image: gcr.io/kaniko-project/executor:latest
      script: |
        echo "{\"auths\":{\"quay.io\":{\"auth\":\"$(echo -n "$QUAY_USERNAME:$QUAY_PASSWORD" | base64 | tr -d '\n')\"}}}" > /kaniko/.docker/config.json
        /kaniko/executor --dockerfile=Dockerfile --destination=quay.io/$QUAY_USERNAME/todo-app:$COMMIT_SHA
  params:
    - name: QUAY_USERNAME
      description: The Quay.io username
    - name: QUAY_PASSWORD
      description: The Quay.io password
    - name: COMMIT_SHA
      description: The commit SHA for the image tag
```
**Promote Image Task:**

Create a `promote-image-task.yaml` file to promote the image to different Quay.io repositories.

```yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: promote-image-task
spec:
  steps:
    - name: promote-image
      image: quay.io/skopeo/stable:latest
      script: |
        skopeo copy docker://quay.io/$QUAY_USERNAME/todo-app:$COMMIT_SHA docker://quay.io/$QUAY_USERNAME/todo-app-$TARGET:$COMMIT_SHA
  params:
    - name: QUAY_USERNAME
      description: The Quay.io username
    - name: COMMIT_SHA
      description: The commit SHA for the image tag
    - name: TARGET
      description: The target environment (stage or prod)
```

**Deploy Task:**

Create a `deploy-task.yaml` file to deploy the image to OpenShift.

```yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: deploy-task
spec:
  steps:
    - name: deploy
      image: 'bitnami/kubectl:latest'
      script: |
        kubectl config set-context --current --namespace=${params.environment}
        kubectl set image deployment/todo-app todo-app=quay.io/$QUAY_USERNAME/todo-app:$COMMIT_SHA
        kubectl rollout status deployment/todo-app
  params:
    - name: environment
      description: The deployment environment (dev, stage, prod)
    - name: COMMIT_SHA
      description: The commit SHA for the image tag
    - name: QUAY_USERNAME
      description: The Quay.io username
```

**Integration and Acceptance Test Tasks:**

Create `integration-test-task.yaml` and `acceptance-test-task.yaml` files for running Cypress tests.

```yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: integration-test-task
spec:
  steps:
    - name: run-cypress-tests
      image: cypress/base:10
      script: |
        npm install
        npm run cypress:run
  params:
    - name: environment
      description: The deployment environment (dev, stage)
```
```yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: acceptance-test-task
spec:
  steps:
    - name: run-acceptance-tests
      image: cypress/base:10
      script: |
        npm install
        npm run cypress:run
  params:
    - name: environment
      description: The deployment environment (prod)
```

#### 3\. Setting Up Helm Charts

**Helm Chart Directory Structure:**

```sh
helm-charts/
└── todo-app/
    ├── Chart.yaml
    ├── values.yaml
    └── templates/
        ├── deployment.yaml
        ├── service.yaml
        └── ingress.yaml
```

**Chart.yaml:**

```yaml
apiVersion: v2
name: todo-app
description: A Helm chart for Kubernetes
type: application
version: 0.1.0
appVersion: "1.0"
```

**values.yaml:**

```yaml
replicaCount: 2

image:
  repository: quay.io/YOUR_QUAY_USERNAME/todo-app
  tag: "latest"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  annotations: {}
  hosts:
    - host: todo-app.local
      paths: ["/"]

resources: {}

nodeSelector: {}

tolerations: []

affinity: {}
```

**templates/deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "todo-app.fullname" . }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ include "todo-app.name" . }}
      release: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app: {{ include "todo-app.name" . }}
        release: {{ .Release.Name }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          ports:
            - containerPort: 80
          readinessProbe:
            httpGet:
              path: /
              port: 80
          livenessProbe:
            httpGet:
              path: /
              port: 80
```

**templates/service.yaml:**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "todo-app.fullname" . }}
spec:
  ports:
    - port: {{ .Values.service.port }}
      targetPort: 80
  selector:
    app: {{ include "todo-app.name" . }}
    release: {{ .Release.Name }}
```

**templates/ingress.yaml:**

```yaml
{{- if .Values.ingress.enabled -}}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "todo-app.fullname" . }}
  annotations:
    {{- range $key, $value := .Values.ingress.annotations }}
      {{ $key }}: {{ $value | quote }}
    {{- end }}
spec:
  rules:
    - host: {{ .Values.ingress.hosts[0].host }}
      http:
        paths:
          - path: {{ .Values.ingress.hosts[0].paths[0] }}
            pathType: Prefix
            backend:
              service:
                name: {{ include "todo-app.fullname" . }}
                port:
                  number: 80
{{- end }}`
```
#### 4\. Configuring Blue-Green Deployment

For blue-green deployment, you need to configure Helm values and templates to support blue and green environments. Adjust your `values.yaml` to include environment-specific settings and use Helm hooks or a custom template logic to manage switching between blue and green deployments.

#### 5\. Running the Pipeline

Apply the Tekton pipeline and tasks to your OpenShift cluster and trigger the pipeline.

```sh
oc apply -f pipeline.yaml
oc apply -f unit-test-task.yaml
oc apply -f static-code-analysis-task.yaml
oc apply -f build-image-task.yaml
oc apply -f promote-image-task.yaml
oc apply -f deploy-task.yaml
oc apply -f integration-test-task.yaml
oc apply -f acceptance-test-task.yaml
```
Create a PipelineRun to trigger the pipeline:

```yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: todo-app-pipeline-run
spec:
  pipelineRef:
    name: todo-app-pipeline
  params:
    - name: QUAY_USERNAME
      value: "your-quay-username"
    - name: QUAY_PASSWORD
      value: "your-quay-password"
    - name: COMMIT_SHA
      value: "latest"
```

Apply the PipelineRun: `oc create -f pipelinerun.yaml`

This PipelineRun will start the CI/CD process, building the image, running tests, and deploying to each environment sequentially.

### Conclusion

This comprehensive guide covers the setup and configuration of a CI/CD pipeline for a ReactJS ToDo application using Tekton, Helm, and OpenShift. By following these steps, you can automate the entire process from code commit to deployment in dev, stage, and prod environments, ensuring quality through unit tests, static analysis, and integration tests, with the flexibility of blue-green deployments.

### Steps
```
podman build  --platform linux/amd64 -t ubi9-build-image:1.0.0 ./images/build-base
oc create secret docker-registry --docker-server quay.io --docker-username $QUAY_USERNAME --docker-password $QUAY_TOKEN quay-io
# add to builder service account
oc secrets link builder quay-io --for=pull,mount
oc secrets link pipeline quay-io --for=pull,mount
oc apply -f images/build-base/bc.yaml 
oc apply -f pipeline/tasks
oc apply -f pipeline/workspace
oc apply -f pipeline/build-app.yml
oc create -f pipeline/build-app-run.yml #run each time we need to run the pipeline
```