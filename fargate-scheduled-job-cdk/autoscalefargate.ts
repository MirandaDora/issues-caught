require('dotenv').config()
import * as cdk from '@aws-cdk/core';
import ecs = require('@aws-cdk/aws-ecs')
import ec2 = require('@aws-cdk/aws-ec2')
import autoScaling = require('@aws-cdk/aws-applicationautoscaling')
import { ScheduledFargateTask } from '@aws-cdk/aws-ecs-patterns'
import { FargateService, FargateTaskDefinition, LogDriver, ScalableTaskCount, Cluster } from '@aws-cdk/aws-ecs';
import { Repository } from '@aws-cdk/aws-ecr';
import { SubnetSelection, SubnetType } from '@aws-cdk/aws-ec2';
import { RetentionDays } from '@aws-cdk/aws-logs'
import iam = require('@aws-cdk/aws-iam')
import { Rule, Schedule } from '@aws-cdk/aws-events';
import { EcsTask } from '@aws-cdk/aws-events-targets';

export class CicdStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const vpcId = 'vpc-180bcc60'
    const subnet = 'subnet-39bac872'
    const securityGroup = 'sg-062d629c0a0a3223e'
    const longRunningReportsECRName = 'ctp-reports-service-v2'
    const stage = 'development'
    const region = 'us-west-2'
    const accountId = '456912105463'
    const resourcePrefix = 'ctp-long-running-reports'
    const analyticsReportBucketName = 'analytics-reports-bucket'
    const vpc = ec2.Vpc.fromLookup(this, vpcId, {
      vpcId: vpcId,
      subnetGroupNameTag: 'default-subnet',
      isDefault: true
    })
    const cluster = new ecs.Cluster(this, 'ctp-long-running-reports', {
      vpc: vpc,
      clusterName: resourcePrefix+'-cluster',
      
    })
    const pinnacleExcutionRole = new iam.Role(this, 'pinnacleExcutionRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        new iam.ServicePrincipal('application-autoscaling.amazonaws.com')
      )
    })
    pinnacleExcutionRole.attachInlinePolicy(new iam.Policy(this, resourcePrefix + '-execute-policy-' + stage, {
      statements: [
        new iam.PolicyStatement({ // cloudwatch
          effect: iam.Effect.ALLOW,
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogGroups',
            'logs:DescribeLogStreams'
          ],
          resources: ['arn:aws:logs:' + region + ':' + accountId + ':log-group:*:*:*']
        }),
        new iam.PolicyStatement({ //ecr and ecs and autoscaling
          effect: iam.Effect.ALLOW,
          actions: [
            'ecr:*',
            'ecs:List*', 
            'ecs:Describe*', 
            'ecs:UpdateService', 
            'application-autoscaling:*',
            'cloudwatch:DescribeAlarms',
            'cloudwatch:PutMetricAlarm'
          ],
          resources: ['*']
        }),
        new iam.PolicyStatement({ // vpc
          effect: iam.Effect.ALLOW,
          actions: [
            'ec2:CreateNetworkInterface',
            'ec2:DescribeNetworkInterfaces',
            'ec2:DeleteNetworkInterface',
            'ec2:DescribeSecurityGroups',
            'ec2:DescribeSubnets',
            'ec2:DescribeVpcs'
          ],
          resources: ['*']
        }),
        new iam.PolicyStatement({ // s3
          effect: iam.Effect.ALLOW,
          actions: [
            's3:*'
          ],
          resources: [
            'arn:aws:s3:::' + analyticsReportBucketName + '/*',
            'arn:aws:s3:::' + analyticsReportBucketName
          ]
        })
      ]
    }))
    const pinnacleTaskDefinition = new FargateTaskDefinition(this, resourcePrefix + '-ctppinnacle-task', {
      cpu: 1024,
      executionRole: pinnacleExcutionRole,
      family: resourcePrefix,
      memoryLimitMiB: 2048,
      taskRole: pinnacleExcutionRole
    })
    const reportECR = ecs.ContainerImage.fromEcrRepository(Repository.fromRepositoryName(this, 'ctp-reports-ecr-v2', longRunningReportsECRName), 'latest')
    const logging = LogDriver.awsLogs({
      streamPrefix: '/ecs/' + resourcePrefix,
      logRetention: RetentionDays.ONE_MONTH
    })
    pinnacleTaskDefinition.addContainer('pinnacle', {
      image: reportECR,
      memoryLimitMiB: 2048,
      command: [
        'node',
        'long-running-reports.js',
        '--type=ctp-pinnacle-report'
      ],
      entryPoint: [],
      essential: true,
      logging: logging,
      environment: {
        'NODE_ENV': 'development'
      }
    })
    const targetSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'sg', securityGroup)
    const pinnacleFargateService = new FargateService(this, 'ctp-long-running-reports-pinnacle', {
      cluster: cluster,
      taskDefinition: pinnacleTaskDefinition,
      desiredCount: 0,
      vpcSubnets: {subnetType: SubnetType.PUBLIC},
      securityGroup: targetSecurityGroup,
      maxHealthyPercent: 100,
      minHealthyPercent: 0,
      assignPublicIp: true,
      serviceName: resourcePrefix + '-service'
    })
    const scale = pinnacleFargateService.autoScaleTaskCount({maxCapacity: 1})
    const autoScaleCron = autoScaling.Schedule.cron({
      minute: '40',
      hour: '1',
      month: '*',
      year: '*',
      day: '*'
    })
    const autoScaleTaskTarget = new EcsTask({
      cluster: cluster,
      taskDefinition: pinnacleTaskDefinition,
      taskCount: 1,
      subnetSelection: {subnetType: SubnetType.PUBLIC},
      securityGroup: targetSecurityGroup,
      
    })
    const scheduleRule = new Rule(this, resourcePrefix + '-schedule-rule', {
      schedule: autoScaleCron,
      targets: [autoScaleTaskTarget],
      enabled: true,
      description: resourcePrefix + ' scales up everyday'
    })
  }
}
