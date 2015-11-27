# AWS Lambda Image Processing

Image processing aiming to run on [AWS Lambda](https://aws.amazon.com/lambda/).
When an image is uploaded to a source S3 bucket, the lambda function will
create processed images (e.g. resized versions) in a target S3 bucket. It is
based on the [AWS Lambda Walkthrough example](http://docs.aws.amazon.com/lambda/latest/dg/walkthrough-s3-events-adminuser.html).

## Usage

### Step 1: Preparation

1. Create an administrator user on AWS. If you have an administrator user,
   you can skip this step. ([*more details*](http://docs.aws.amazon.com/lambda/latest/dg/walkthrough-s3-events-adminuser-prepare.html))
2. Create two buckets, source and target buckets. The names will be specified
   later in the `.env` file in Step 2.
3. Set up the AWS CLI. ([*more details*](http://docs.aws.amazon.com/lambda/latest/dg/walkthrough-s3-events-adminuser-prepare.html))

### Step 2: Create and test the lambda function

1. Create an IAM Role (execution role). ([*more details*](http://docs.aws.amazon.com/lambda/latest/dg/walkthrough-s3-events-adminuser-create-test-function-create-execution-role.html))
2. Copy `.env.example` to `.env`, and modify the configuration as needed.

   ```
   AWS_PROFILE=replace-me
   AWS_LAMBDA_ROLE_ARN=replace-me

   S3_SOURCE_BUCKET=replace-me
   S3_TARGET_BUCKET=replace-me
   S3_SOURCE_BUCKET_OWNER_ACCOUNT_ID=replace-me
   ```

3. Upload the deployment package.

   ```
   foreman run make create-function
   ```

4. (Optional) Test the lambda function (invoke manually).

   TODO

### Step 3: Configure Amazon S3 to publish events

1. Add permission to the Lambda function access policy to allow Amazon S3 to invoke the function.

   ```
   foreman run make add-permission
   ```

2. (Optional) Verify the access policy of your function.

   ```
   foreman run make get-policy
   ```

3. Add notification configuration to your source bucket. ([*more details*](http://docs.aws.amazon.com/lambda/latest/dg/walkthrough-s3-events-adminuser-configure-s3.html))

### Step 4: Give it a try

Upload an image to the source bucket, and see the thumbnails created in the target bucket.

### And then you can also...

- Update the function code.

   ```
   foreman run make update-function-code
   ```

- Get the function.

   ```
   foreman run make get-function
   ```

## Contributing

1. Fork it ( https://github.com/starsirius/aws-lambda-image-processing/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

## License
MIT. You can check out the full license [here](LICENSE).
