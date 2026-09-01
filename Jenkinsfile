pipeline {
    agent any

    stages {

        stage('Checkout from SCM') {
            steps {
                deleteDir()
                checkout scm
            }
        }

        stage('Frontend Build and Lint') {
            steps {
                dir('frontend') {
                    bat 'npm ci'
                    bat 'npm run lint'
                    bat 'npm run build'
                }
            }
        }

        stage('Backend Check') {
            steps {
                dir('backend') {
                    bat 'node --check server.js'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                bat 'docker compose build'
            }
        }
    }

    post {
        success {
            echo 'CI Pipeline completed successfully!'
        }

        failure {
            echo 'CI Pipeline failed. Check the console output.'
        }

        always {
            echo 'Post actions completed.'
        }
    }
}