@Library(['srePipeline']) _

def pipelinesettings = [
  tagVersion: "",                               // Use if you would like to override the default tag version (using git)
  deploy: [
    [name: "sre-go-helloworld" ]                // Containers to publish
  ],

  chart: "deployment",                         // Location of helm chart

  gitDefaultBranch: "main",                     // The default branch to use for GIT (defaults to master if not specified)
  overridePipelineDockerVersion: "2023.02.22-3b0ab75-18",  // Override which image tag to use for pipeline image
  prepare: 1,                                   // GIT Clone
  unittest: 1,                                  // Unit-test
  harborLogin: 1,                               // Log into Harbor (harbor.eticloud.io) for pulling (base) images
  build: 1,                                     // Build container
  extraBuildArguments: "",                      // Extra build arguments to pass to the docker build command
  buildMultipleContainerImages: 1,              // Enable if you are creating multiple images (listed in the deploy array above)
  executeCC: 1,                                 // Generate Code Coverage report
  lint: 1,                                      // GO Lint
  sonarQube: [                                                // SonarQube parameters
    propertiesFile: "./build/sonar-project.properties"        // SonarQube scan
  ],
  panoptica: [                                                // Panoptica Scan Parameters
    productName: "securecn",                                  // The Product/Venture name
    imageName: "sre-go-helloworld",                           // The image name + tag to scan
    args: "--highest-severity-allowed HIGH --ignore-no-fix",  // Arguments passed to the Panoptica CLI
  ],
  publishContainer: 1,                          // Publish container
  forcePublishContainer: 1,                     // Force Publish on any branch. Otherwise executed only on tags
  garPublish: 1,                                // Publish image to GAR/GCR (Google Artifact/Container Registry)
  gcpLogin: 1,                                  // Required for GAR/GCR publish and for pulling images from GAR/GCR
  garCredId: 'k8sec_jenkins_gar_user_cred',     // Jenkins creds to use for GCP login
  garUser: 'jenkins-gar-publish@gcp-etigcp-nprd-12855.iam.gserviceaccount.com', // GAR/GCR service account email for accessing GAR/GCR
  garUrl: 'us-docker.pkg.dev/eticloud/gcr.io',  // GAR/GCR repo url to use
  ecr: 1,                                       // Publish container to Private ECR
  ciscoContainer: 1,                            // Publish container to containers.cisco.com
  dockerHub: 1,                                 // Publish container to dockerhub.cisco.com
  pushPublicRegistryOnTag: 1,                   // Publish container to Public ECR on tag
  // forceCorona: 1,                            // Force Corona Scan on any branch. Otherwise executed only on tags
  corona: [                                     // Corona paramters
    releaseID: "73243",                         // Corona Release ID
    productID: "6726",                          // Corona Project ID
    csdlID: "84720",                            // Corona CSDL ID
    securityContact: "sraradhy@cisco.com",      // Corona Security Contact
    engineeringContact: "sraradhy@cisco.com",   // Corona Engineering Contact
    imageAdmins: "sraradhy,jegarnie",           // Corona Image Admins
    waitTimeout: 1800,                          // Time to wait for Corona image preparation, scan, delete (optional)
  ],
  // forceBlackduck: 1,                         // Force Blackduck Scan on any branch. Otherwise executed only on tags
  blackduck: [
    email: "eti-sre-admins@cisco.com",
  ],                                            // Blackduck Open Source Scan
  publishHelm: 1,                               // Publish Helm Chart to ChartMuseum
  useMultipleHelm:1,                            // Publish Multiple Charts
  artifactory: 1,                               // Use Artifactory creds
  stricterCCThreshold: 90.0,                    // Fail builds for Code Coverage below 90%
  cdPromotionJobPath: "../../deploy/dev/sre-go-helloworld-dev-deployment",
]

// Example Custom stage usage:
def assignParams =[ label: 'assignParams', action: { p ->
  stage ('ASSIGN PARAMS') {
    sreUtils.figlet('ASSIGN PARAMS')
    script {
      //checkout scm
      env.TAG_VERSION = sh(script : "git rev-parse HEAD", returnStdout: true).trim()
      p["tagversion"] = env.TAG_VERSION
      println("Tag Version is: ${env.TAG_VERSION}")
      env.VERSION = sh(script : "git describe --tags", returnStdout: true).trim()
      p["extraBuildArguments"] = "--build-arg IMAGE_VERSION=${env.VERSION}"
      println("Image Version is: ${env.VERSION}")
      withCredentials([string(credentialsId: 'eti-sre-cicd-external-github-token',
                                variable: 'password')]) {
          sh("./jenkins-pipeline-utils/setup-intertal-git-credentials.sh")
      }
    }
  }
}]

def stages = srePipeline.getDefaultStages()
sreStages.insertStageAfter(stages, 'prepare', assignParams)

srePipeline.runPipeline(pipelineSettings, stages)
