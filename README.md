# Conquer Builds and Deployments with Tekton Pipelines: Your Automated BFF!
Have you ever dreamt of a world where deploying your applications happens effortlessly? No more wrestling with complex commands or scrambling to fix errors. Well, dream no more! Tekton Pipelines is here to transform your deployment process from a chore into a smooth, automated ride.

This blog post dives into the exciting world of Tekton Pipelines, guiding you through building and deploying a cool to-do list application. Even if you're new to DevOps, we'll break things down into easy-to-understand steps.

**Imagine this**: You've built a fantastic to-do list app with a sleek user interface (built with ReactJS) and a powerful backend (powered by Quarkus). Now, you want to share it with the world, but the thought of manually deploying it to different environments (development, staging, production) makes you groan.

**Enter Tekton Pipelines!** It's like a friendly robot chef in your development kitchen. You tell it what ingredients you have (your code) and what dish you want to cook (your deployed app), and it takes care of the rest. It follows a recipe (called a pipeline) with clear instructions, ensuring a delicious deployment every single time.

**Here's a sneak peek at the magic Tekton performs:**

1. **Code on the Move**: Tekton grabs the code for your to-do list app from your favorite code repository (like GitHub).
2. **Config Check**: It then checks a special file named app-config.yaml to understand how to build and deploy your app. Think of it as a secret recipe that tells Tekton exactly what spices to use (build commands) for your unique app.
3. **Build Like a Boss**: Based on the recipe, Tekton builds your app, creating a special software package called a container image. This image is like a pre-assembled dish, ready to be served on any server.
4. **Deployment Dance**: Tekton then waltzes over to your deployment configurations (stored in another code repository) and updates them with the new and improved image of your app. It can even create pull requests or automatically merge changes, depending on your preference.
Voila! Your App is Live! With all the ingredients perfectly combined, Tekton deploys your to-do list app to the desired environment (dev, staging, or production). Now, you can start managing your tasks with ease!

**The Benefits are Tremendous!**

Using Tekton Pipelines brings a buffet of advantages to your development table:

 - **Say Goodbye to Manual Labor**: No more spending hours manually deploying your app. Tekton automates the process, freeing you up for more creative tasks.
- **Version Control is Your Friend**: Tekton uses GitOps, which means your deployment configurations are stored in code repositories, just like your application code. This allows for easy tracking of changes and rollback if needed.
- **Flexibility is the Spice of Life**: Tekton Pipelines are like building blocks. You can customize them to fit the unique needs of your app.
- **Reuse and Recycle**: Once you create a Tekton task (like building your app), you can reuse it for other projects, saving you time and effort.

## Building and Deploying Your App with Tekton Pipelines: A Deep Dive

Now that we've whet your appetite, let's delve into the technical details. To create a smooth and automated pipeline, we'll leverage the following resources:

**Tekton Pipelines**: The star of the show, it automates the entire deployment process.
Git Repository: This is where your code resides, like a recipe book for your app.
**Persistent Volume Claim (PVC)**: This acts like a shared storage space for Tekton tasks to access data during the deployment process.
**Tekton Resources**: These are like building blocks (tasks, workspaces, pipelines) that Tekton uses to construct the deployment pipeline.

### Pipeline Resource: The Recipe
The `build-app`
1. **git-clone-source**: This task, like a sous chef, grabs the code for your to-do list app from your Git repository.
2. **retrieve-app-configs**: This task acts like a recipe interpreter, reading a special file named `app-config.yaml`. This file contains crucial information on how to build and deploy your app, similar to how a recipe specifies ingredients and cooking instructions.
3. **npm-build (conditional)**: Depending on the instructions in app-config.yaml, this task might be called upon. It's like a master chef following specific build commands (mentioned in the recipe) for your app's frontend (built with ReactJS in this case).
4. **maven-build** (conditional): Similar to the previous task, this one follows build commands for your app's backend (powered by Quarkus), if applicable.
5. **build-and-push-image**: This task is the master chef in action! It uses S2I (Source-to-Image) to build your app's container image, which is essentially a pre-packaged version of your app ready to run on any server. Imagine this as the final, delicious dish.
6. **git-clone-deployment-repo**: This task retrieves the deployment configuration code from another Git repository. Think of it as fetching the instructions on how to serve the cooked dish (your app) to the guests (different environments).
7. **update-dev-deployment, update-stage-deployment, update-prod-deployment**: These tasks are like waiters who update the deployment configurations for different environments (development, staging, production) with the new image of your app. They can even create pull requests or automatically merge changes, depending on your preference. It's like adding a final touch to the presentation before serving.

### Workspaces: The Kitchen Counter

In the sample code, Tekton utilizes a workspace named `source` which acts like your kitchen counter. It stores the downloaded code from both your application and deployment repositories, allowing tasks to easily access them during the deployment process.

### PipelineRun: Running the Magic Show:

A PipelineRun resource acts as the trigger, initiating the entire deployment process defined in the pipeline. With all the ingredients (code, configurations) and tools (Tekton resources) in place, Tekton executes the pipeline steps, automating the deployment of your to-do list app.

The Benefits of This Approach:

By leveraging Tekton Pipelines and the mentioned resources, you gain several advantages:

Automation Magic: No more manual deployments, freeing you up for more creative endeavors.
Version Control is Your Sous Chef: Everything is tracked in code repositories, making it easy to collaborate and roll back changes if needed.
Flexibility is the Spice of Life: Tekton Pipelines are customizable, allowing you to tailor them to your specific project needs.
Reuse and Recycle Tasks: Once created, Tekton tasks can be reused for other projects, saving you time and effort.

Now that you're familiar with the core concepts, let's get your hands dirty and build a Tekton pipeline for your to-do list application! Here's a breakdown of the steps involved:

Prerequisites:

OpenShift Cluster with Tekton Pipelines installed.
Persistent Volume Claim (PVC): Create a PVC to provide shared storage (1 GiB recommended) for Tekton tasks to access data during the deployment process. You can use the following YAML snippet as a reference:
YAML
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: source
  namespace: apps
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
Use code with caution.
content_copy
1. Define Tekton Resources:

Tasks: These are reusable building blocks that define specific actions within the pipeline. Here are some examples of tasks you might need:

git-clone-source: This task clones the source code for your to-do list app from your Git repository.
retrieve-app-configs: This task reads the app-config.yaml file to understand build and deployment configurations.
npm-build (conditional): This task executes npm build commands if your frontend is built with ReactJS.
maven-build (conditional): This task executes Maven build commands if your backend is built with Quarkus.
build-and-push-image: This task builds your application container image using S2I and pushes it to a container registry.
git-clone-deployment-repo: This task clones the deployment configuration repository.
update-dev-deployment, update-stage-deployment, update-prod-deployment: These tasks update deployment configurations for different environments with the new image tag and can create pull requests or automatically merge changes.
You can find detailed information on defining Tekton tasks in the official documentation https://www.redhat.com/architect/cicd-pipeline-openshift-tekton.

Pipeline: This resource combines tasks in a sequential order, defining the overall deployment workflow. It references the tasks you created and specifies the execution order.

PipelineRun: This resource triggers the execution of your defined pipeline with specific parameters (e.g., application name, Git repository URL).

2. Sample Pipeline Structure:

Here's a simplified example of a pipeline YAML file for reference (note that this might need adjustments based on your specific application):

YAML
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: build-app
spec:
  resources:
    - name: source
      type: PersistentVolumeClaim
  params:
    - name: app  # Name of your application (e.g., todo-ui)
    - name: repo-url  # Git repository URL for your application code
    - name: repo-revision  # Git repository revision (e.g., master)
    - name: auto-deployment  # (Optional) Enable automatic deployment (true/false)
  tasks:
    - name: clone-source
      taskRef:
        name: git-clone-source
      resources:
        - name: source
          from: ""
    - name: get-app-config
      taskRef:
        name: retrieve-app-configs
      resources:
        - name: source
          from: ""
    - name: build-frontend (conditional)
      taskRef:
        name: npm-build
      # Specify conditions based on app config
    - name: build-backend (conditional)
      taskRef:
        name: maven-build
      # Specify conditions based on app config
    - name: build-and-push-image
      taskRef:
        name: build-and-push-image
      resources:
        - name: source
          from: ""
    - name: clone-deployment-repo
      taskRef:
        name: git-clone-deployment-repo
      resources:
        - name: source
          from: ""
    - name: update-dev-deployment (parallel)
      taskRef:
        name: update-dev-deployment
    - name: update-stage-deployment (parallel)
      taskRef:
        name: update-stage-deployment
    - name: update-prod-deployment (parallel)
      taskRef:
        name: update-prod-deployment
Use code with caution.
content_copy
3. Run the Pipeline:

Once you've defined your tasks, pipeline, and ensured all resources are in place, you can trigger the deployment process using a `PipelineRun
With all the ingredients prepped (Tekton resources) and the recipe defined (pipeline), it's time to fire up the deployment oven! Here's how to run your Tekton pipeline:

1. Create a PipelineRun Resource:

A PipelineRun acts as the ignition switch for your pipeline. You can create it using the kubectl command-line tool or the OpenShift web console. Here's an example YAML snippet for a PipelineRun resource:

YAML
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: todo-app-deployment  # Descriptive name for your pipeline run
spec:
  pipelineRef:
    name: build-app  # Reference the pipeline you created
  params:
    - name: app
      value: todo-ui  # Your application name
    - name: repo-url
      value: https://github.com/your-username/todo-list-app  # Your Git repository URL
    - name: repo-revision
      value: main  # Your Git repository revision (branch/tag)
    # Optional parameter for automatic deployment
    - name: auto-deployment
      value: false  # Set to true for automatic deployment (if supported by your tasks)
Use code with caution.
content_copy
2. Execute the PipelineRun:

Using kubectl:
Save the PipelineRun YAML snippet as a file (e.g., todo-app-run.yaml). Then, execute the following command to initiate the pipeline run:

kubectl apply -f todo-app-run.yaml
Using OpenShift Web Console:
Go to the Pipelines section in the OpenShift web console.
Click on Pipeline Runs.
Click Create Pipeline Run.
Provide a name for your run and select the build-app pipeline.
Define the parameters (app name, Git repository details, etc.).
Click Create.
3. Monitor the Pipeline Execution:

Once you've triggered the pipeline run, you can monitor its progress within the OpenShift web console or using kubectl get pipelinerun. The pipeline will execute each task sequentially, building your application image and updating deployment configurations for your desired environments.

4. Witnessing the Delicious Outcome!

Upon successful completion of the pipeline run, your to-do list application will be deployed to the specified environments (development, staging, production) depending on your configuration. You can now access your application and start managing your tasks with ease!

Bonus Tip: Leverage Tekton Triggers to automate pipeline runs based on specific events, such as pushing code changes to your Git repository. This keeps your deployments even more streamlined.

Conclusion:

Tekton Pipelines empower you to automate the deployment process, freeing you from repetitive tasks and allowing you to focus on building amazing applications. With the knowledge you've gained, you can now leverage Tekton to streamline your deployments and embrace the magic of automation!