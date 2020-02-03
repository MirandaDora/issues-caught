## problem:
Lambda is good. But, sometimes it has the following limitations:
1. 15min execution time might be unable to finish the task.
2. run time environment is managed by AWS, hence cannot run customized environment, e.g. have lower level dependency/ executable dependency.

The striate forward way to over come those limitations is Docker. The alternative would be:
1. ECS - EC2
2. ECS - fargate
3. AWS Batch

While in most cases, we would want to run ECS - fargate as the option becasue:
* Serverless
* Fast bootup
* Pay as you go

When a long running process such as daily job, hourly reports, we can use scheduled job (only scale up 1 node) to complete the task.

## solution:
Define a scheduled event for fargate, run at a certain interval or a certain time of the day.

## cicd:
while I have tried to use different approaches of cicd to manage the pipeline, found the following ways:
1. Serverless framework
2. Native cloudformation
3. CDK

For the CDK, there are three ways to do it:
Method | Description | Does this work? | How to validate | Pros | Cons
----- | ----------- | --------------- | --------------- | ---- | ----
CDK   | `new EcsTask` to create the autoscaling task target, attch it to a scheduled `Rule` | Yes | should have a rule created in cloudwatch, ecs cluster should be attached with this rule in the `autoscale` tab. | simple, efficient | not strateforward to validate.
CDK   | use service's `autoScaleTaskCount` return a task auto scale object, use `scaleOnSchedule` | No | | might be working for other types of scale | seems simple but does not work.
CDK   | use pure auto scale with event and alarm | Yes | validate if the alarm is triggering, and the ecs task should be scaled up | better control over the trigger point | more resource to be defined and created

First Header | Description | Does this work? | How to validate | Pros | Cons
------------ | ------------- | ------------- | ------------- | ------------- | -------------
CDK | `new EcsTask` to create the autoscaling task target, attch it to a scheduled `Rule`
CDK | use service's `autoScaleTaskCount` return a task auto scale object, use `scaleOnSchedule`

Will explore more on this part -- to find the best approach for a balance point of customization and simplicity.