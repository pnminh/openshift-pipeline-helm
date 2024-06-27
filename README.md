Application lifecycle with Tekton and Helm Charts on OpenShift
----------------------------------------------------------------------------------

In this blog post, we will go through the full application lifecycle using Tekton and Helm charts. The journey starts with setting up the Tekton and then step-by-step configuration of Tekton to build and deploy an app to dev environment and then promote it to staging and production. To make it simple, we ues an example of a ToDo app and a single Openshift cluster for the whole process.

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

*Pipeline Definition:**

Here is an overview of the tekton pipeline would do in general. This does not provide specific details of the real pipeline

```yaml
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: todo-app-pipeline
spec:
  tasks:
    - name: test-and-build-app
      taskRef:
        name: test-and-build-app-task
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
```
### Build Steps
For the build steps, depend on the configs spefied in`app-config.yaml` file in each of the app, we will use different build environment for each application. In the sample code, we have `npm` to run build for frontend app and maven for the quarkus API app.

We also take advantage of Openshift's BuildConfig with s2i image to bundle the app's build output and create a deployable image at the end.
To achieve that we will utilize Helm chart which allows us to generate Openshift resources with customizable values.
```sh
cd helm && helm create build-app
```
The chart only needs to create a BuildConfig resource. Create a template for the BuildConfig like so:
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
On the tekton side, we will utilize the task [build-and-push-image.yaml](./pipeline/tasks/build-and-push-image.yml) to create a helm release for BuildConfig on Openshift, then run the build with the fed build output from the privious build step

## Deployment steps

We utilize GitOps with ArgoCD for deployment phase. The dev and stage deployments use K8s `Deployment` resources, while prod deployment utilizes blue-green configs with Argo `Rollouts`.

All deployments for various environments reference a single Git branch. Follow these steps for any new changes:
- Create a new branch and PR for dev deployment. After PR review, merge it into the main branch to initiate a new deployment to the dev environment.
- Repeat the same steps for stage and prod environments.
Deployments in `dev` and `stage` are standalone, while `prod` deployments, excluding todo-db due to its nature as a database service, are deployed using Blue-Green configurations.
### Key Points
- **Single Git Branch**: All environments reference the main branch for consistency.
- **PR Review Process**: Ensures quality and approval before merging.
- **Standalone Deployments**: Dev and stage environments have independent deployments.
- **Blue-Green Deployments**: Prod deployments (except todo-db) utilize Blue-Green strategies for minimal downtime.

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
oc create secret generic git-creds --from-literal GIT_USER=$TEKTON_GIT_USER --from-literal GIT_TOKEN=$TEKTON_GIT_PASSWORD
# add to builder service account
oc secrets link builder quay-io --for=pull,mount
oc secrets link pipeline quay-io --for=pull,mount
oc apply -f images/build-base/bc.yaml 
oc apply -f pipeline/tasks
oc apply -f pipeline/workspace
oc apply -f pipeline/build-app.yml
oc create -f pipeline/build-app-run.yml #run each time we need to run the pipeline
```