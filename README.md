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

## Building and Deploying Your App with Tekton Pipelines

Now that we've whet your appetite, let's delve into the technical details. To create a smooth and automated pipeline, we'll leverage the following resources:

**Tekton Pipelines**: The star of the show, it automates the entire deployment process.
**Git Repository**: This is where your code resides, like a recipe book for your app.
**Persistent Volume Claim (PVC)**: This acts like a shared storage space for Tekton tasks to access data during the deployment process.
**Tekton Resources**: These are like building blocks (tasks, workspaces, pipelines) that Tekton uses to construct the deployment pipeline.
### The Benefits of This Approach:
By leveraging Tekton Pipelines and the mentioned resources, you gain several advantages:
  - **Automation Magic:* No more manual deployments, freeing you up for more creative endeavors.
  - **Version Control is Your Sous Chef:** Everything is tracked in code repositories, making it easy to collaborate and roll back changes if needed.
  - **Flexibility is the Spice of Life:** Tekton Pipelines are customizable, allowing you to tailor them to your specific project needs.
  - **Reuse and Recycle Tasks:** Once created, Tekton tasks can be reused for other projects, saving you time and effort.

## Cooking Time
Now that you're familiar with the core concepts, let's get your hands dirty and build a Tekton pipeline for your to-do list application! Here's a breakdown of the steps involved:

### Prerequisites:

- OpenShift Cluster with Tekton Pipelines installed. Tekton can be installed with Openshift Pipelines Operator
- ArgoCD instance is up and connected to the target deployment clusters. On Openshift, Openshift GitOps Operator not only helps with creating a fully run ArgoCD instance and support integation with managed clusters if you use [Red Hat Advanced Cluster Management for Kubernetes](https://www.redhat.com/en/technologies/management/advanced-cluster-management)

### Application Stack Overview
The "To Do" application stack is structured as follows:
- **todo-ui:** A ReactJS front-end providing the user interface.
- **todo-api:** A Quarkus back-end API handling the application's business logic.
- **todo-db:** A PostgreSQL database for data persistence.
The source code for the application resides in a single repository, while the deployment configurations are kept in a separate GitOps repository managed by ArgoCD.

### Repository Structure
#### [Application Repository](https://github.com/pnminh/openshift-pipeline-helm/tree/tekton/apps)
Each component in the application repository contains a configuration file named app-config.yaml, which specifies build and deployment settings for Tekton. Here's an example configuration for todo-api:

```yaml
build-type: mvn
build-binary-dir: target/lib
deploy-gitops-repo: https://github.com/your-org/app-gitops-configs.git
```
#### [Deployment Repository](https://github.com/pnminh/app-gitops-configs)
The deployment repository follows a structured layout to manage different environments and applications:

- **apps:** Contains Argo applications for deployment to OpenShift. This includes a sub-directory for different environments, each with specific configuration files.
- **appssets:** Contains ApplicationSet resources for deploying multiple applications across environments.
- **scripts:** Utility scripts, such as create-new-app.sh, to initialize the structure for new applications.

## Pipeline Configurations
### [Pipeline Resources](./pipeline/build-and-deploy-app.yml)
The `build-app`
1. **git-clone-source**: This task, like a sous chef, grabs the code for your to-do list app from your Git repository.
2. **retrieve-app-configs**: This task acts like a recipe interpreter, reading a special file named `app-config.yaml`. This file contains crucial information on how to build and deploy your app, similar to how a recipe specifies ingredients and cooking instructions.
3. **npm-build (conditional)**: Depending on the instructions in app-config.yaml, this task might be called upon. It's like a master chef following specific build commands (mentioned in the recipe) for your app's frontend (built with ReactJS in this case).
4. **maven-build** (conditional): Similar to the previous task, this one follows build commands for your app's backend (powered by Quarkus), if applicable.
5. **build-and-push-image**: This task is the master chef in action! It uses S2I (Source-to-Image) to build your app's container image, which is essentially a pre-packaged version of your app ready to run on any server. Imagine this as the final, delicious dish.
6. **git-clone-deployment-repo**: This task retrieves the deployment configuration code from another Git repository. Think of it as fetching the instructions on how to serve the cooked dish (your app) to the guests (different environments).
7. **update-dev-deployment, update-stage-deployment, update-prod-deployment**: These tasks are like waiters who update the deployment configurations for different environments (development, staging, production) with the new image of your app. They can even create pull requests or automatically merge changes, depending on your preference. It's like adding a final touch to the presentation before serving.

### [Tasks](./pipeline/tasks/)
This `pipeline resources` mentioned previously combine tasks in a sequential order, defining the overall deployment workflow. These are reusable building blocks that define specific actions within the pipeline. We have predefined `ClusterTasks` that are part of Openshift pipeline, such as `git-clone-source` that is used to clone the source code for your to-do list app from your Git repository, as well as some custom tasks that we create to support the specific use cases:
**retrieve-app-configs**: This task reads the app-config.yaml file to understand build and deployment configurations.
**npm-build**: This task executes npm build commands.
**maven-build**: This task executes Maven build commands.
**build-and-push-image**: This task builds your application container image using S2I and pushes it to a container registry.
**update-deployment-repo**: These tasks update deployment configurations for different environments with the new image tag and can create pull requests or automatically merge changes.
You can find detailed information on defining Tekton tasks in the official documentation https://www.redhat.com/architect/cicd-pipeline-openshift-tekton.

### [Workspaces](./pipeline/workspace/source-pvc.yml)
In the sample code, Tekton utilizes a workspace named `source` which acts like your kitchen counter. It stores the downloaded code from both your application and deployment repositories, allowing tasks to easily access them during the deployment process.

### [PipelineRun](./pipeline/build-and-deploy-app-run.yml)
A PipelineRun resource acts as the trigger, initiating the entire deployment process defined in the pipeline. With all the ingredients (code, configurations) and tools (Tekton resources) in place, Tekton executes the pipeline steps, automating the deployment of your to-do list app.

### Run the Pipeline with PipelineRun

  - **Using oc command:** `oc create -f build-and-deploy-app-run.yml`
  - **Using OpenShift Web Console:**
    1. Go to the Pipelines section in the OpenShift web console.
    2. Click on Pipeline Runs.
    3. Click Create Pipeline Run.
    4. Provide a name for your run and select the build-app pipeline.
    5. Define the parameters (app name, Git repository details, etc.).
    6. Click Create.
### Monitor the Pipeline Execution

Once you've triggered the pipeline run, you can monitor its progress within the OpenShift web console or using kubectl get pipelinerun. The pipeline will execute each task sequentially, building your application image and updating deployment configurations for your desired environments.

### Witnessing the Delicious Outcome!

Upon successful completion of the pipeline run, your to-do list application will be deployed to the specified environments (development, staging, production) depending on your configuration. You can now access your application and start managing your tasks with ease!

**Bonus Tip:** Leverage Tekton Triggers to automate pipeline runs based on specific events, such as pushing code changes to your Git repository. This keeps your deployments even more streamlined.

## Conclusion:

Tekton Pipelines empower you to automate the deployment process, freeing you from repetitive tasks and allowing you to focus on building amazing applications. With the knowledge you've gained, you can now leverage Tekton to streamline your deployments and embrace the magic of automation!