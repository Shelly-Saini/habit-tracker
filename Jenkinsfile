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

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarQubeScanner'

                    withSonarQubeEnv('SonarQube') {
                        bat """
                            "${scannerHome}\\bin\\sonar-scanner.bat" ^
                            -Dsonar.projectKey=habit-tracker ^
                            -Dsonar.projectName="Habit Tracker" ^
                            -Dsonar.sources=. ^
                            -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/public/**,**/assets/**
                        """
                    }
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