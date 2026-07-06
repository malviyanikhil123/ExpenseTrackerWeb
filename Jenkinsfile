pipeline {
    agent any

    parameters {
        choice(
            name: 'SERVICE',
            choices: ['BACKEND', 'FRONTEND', 'BOTH'],
            description: 'Select which service to deploy'
        )
    }

    environment {
        IMAGE_API = "nikhilmalviya80/expense-api:latest"
        IMAGE_UI = "nikhilmalviya80/expense-ui:latest"

        COMPOSE_FILE = "/home/nikhil_malviya/docker/ExpenseTracker/docker-compose.yml"
    }

    stages {

        stage('Checkout') {
            steps {
                deleteDir()

                git(
                    branch: 'main',
                    credentialsId: 'github-creds',
                    url: 'https://github.com/malviyanikhil123/ExpenseTrackerWeb.git'
                )
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {

                    sh '''
                    echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
                    '''
                }
            }
        }

        stage('Build & Push') {
            steps {
                script {

                    if (params.SERVICE == 'BACKEND' || params.SERVICE == 'BOTH') {

                        echo "========== Building Backend =========="

                        dir('backend') {
                            sh """
                                docker build -t ${IMAGE_API} .
                                docker push ${IMAGE_API}
                            """
                        }
                    }

                    if (params.SERVICE == 'FRONTEND' || params.SERVICE == 'BOTH') {

                        echo "========== Building Frontend =========="

                        dir('frontend') {
                            sh """
                                docker build -t ${IMAGE_UI} .
                                docker push ${IMAGE_UI}
                            """
                        }
                    }

                }
            }
        }

        stage('Deploy') {
            steps {
                script {

                    if (params.SERVICE == 'BACKEND' || params.SERVICE == 'BOTH') {

                        echo "========== Deploying Backend =========="

                        sh """
                            docker-compose -f ${COMPOSE_FILE} pull expense-api
                            docker-compose -f ${COMPOSE_FILE} up -d --no-deps --force-recreate expense-api
                        """
                    }

                    if (params.SERVICE == 'FRONTEND' || params.SERVICE == 'BOTH') {

                        echo "========== Deploying Frontend =========="

                        sh """
                            docker-compose -f ${COMPOSE_FILE} pull expense-ui
                            docker-compose -f ${COMPOSE_FILE} up -d --no-deps --force-recreate expense-ui
                        """
                    }

                }
            }
        }

    }

    post {

        success {
            echo "========================================"
            echo "Expense Tracker Deployment Successful"
            echo "========================================"
        }

        failure {
            echo "========================================"
            echo "Expense Tracker Deployment Failed"
            echo "========================================"
        }

        always {
            sh 'docker image prune -f || true'
        }
    }
}