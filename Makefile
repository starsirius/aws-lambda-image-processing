DIST_DIR = dist
PACKAGE_FILENAME = lambda.zip
FUNCTION_NAME = CreateThumbnails
HANDLER = handler

create-function: check-AWS_PROFILE check-AWS_LAMBDA_ROLE_ARN install zip
	aws lambda create-function \
		--region us-west-2 \
		--function-name $(FUNCTION_NAME) \
		--handler $(FUNCTION_NAME).$(HANDLER) \
		--runtime nodejs \
		--role $(AWS_LAMBDA_ROLE_ARN) \
		--zip-file fileb://./$(DIST_DIR)/$(PACKAGE_FILENAME) \
		--profile $(AWS_PROFILE) \
		--timeout 10 \
		--memory-size 1024

update-function-code: check-AWS_PROFILE install zip
	aws lambda update-function-code \
		--function-name $(FUNCTION_NAME) \
		--zip-file fileb://./$(DIST_DIR)/$(PACKAGE_FILENAME) \
		--profile $(AWS_PROFILE)

add-permission: check-S3_SOURCE_BUCKET check-S3_SOURCE_BUCKET_OWNER_ACCOUNT_ID check-AWS_PROFILE
	aws lambda add-permission \
		--function-name $(FUNCTION_NAME) \
		--region us-west-2 \
		--statement-id $(shell uuidgen) \
		--action "lambda:InvokeFunction" \
		--principal s3.amazonaws.com \
		--source-arn arn:aws:s3:::$(S3_SOURCE_BUCKET) \
		--source-account $(S3_SOURCE_BUCKET_OWNER_ACCOUNT_ID) \
		--profile $(AWS_PROFILE)

get-function: check-AWS_PROFILE
	- aws lambda get-function \
		--function-name $(FUNCTION_NAME) \
		--profile $(AWS_PROFILE)

get-policy: check-AWS_PROFILE
	aws lambda get-policy \
		--function-name $(FUNCTION_NAME) \
		--profile $(AWS_PROFILE)

install:
	npm install

zip:
	mkdir -p ./$(DIST_DIR)
	zip -r ./$(DIST_DIR)/$(PACKAGE_FILENAME) . -x "*$(DIST_DIR)*"

check-%:
	@ if [ "${${*}}" == "" ]; then \
		echo "Environment variable $* not set"; \
                exit 1; \
        fi

.PHONY: create-function update-function-code add-permission get-function get-policy install zip
