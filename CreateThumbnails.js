require('dotenv').load();
var async = require('async');
var AWS = require('aws-sdk');
var gm = require('gm').subClass({ imageMagick: true }); // Enable ImageMagick integration.
var util = require('util');

// constants
var MAX_WIDTH  = 100;
var MAX_HEIGHT = 100;
var S3_SOURCE_BUCKET = process.env.S3_SOURCE_BUCKET
  , S3_TARGET_BUCKET = process.env.S3_TARGET_BUCKET;

// get reference to S3 client
var s3 = new AWS.S3();

exports.handler = function(event, context) {
  // Read options from the event.
  console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));
  var srcBucket = event.Records[0].s3.bucket.name;
  // Object key may have spaces or unicode non-ASCII characters.
  var srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
  var dstKey = srcKey + "-resized";

  if (S3_SOURCE_BUCKET == null || S3_TARGET_BUCKET == null) {
    console.error("S3_SOURCE_BUCKET and S3_TARGET_BUCKET must be defined.");
    return;
  }

  if (srcBucket != S3_SOURCE_BUCKET) {
    console.error("Source bucket from the event must match S3_SOURCE_BUCKET.");
    return;
  }

  // Sanity check: validate that source and destination are different buckets.
  if (S3_SOURCE_BUCKET == S3_TARGET_BUCKET) {
    console.error("Destination bucket must not match source bucket.");
    return;
  }

  // Infer the image type.
  var typeMatch = srcKey.match(/\.([^.]*)$/);
  if (!typeMatch) {
    console.error('unable to infer image type for key ' + srcKey);
    return;
  }
  var imageType = typeMatch[1];
  if (imageType != "jpg" && imageType != "png") {
    console.log('skipping non-image ' + srcKey);
    return;
  }

  // Download the image from S3, transform, and upload to a different S3 bucket.
  async.waterfall([
    function download(next) {
      // Download the image from S3 into a buffer.
      s3.getObject({
          Bucket: S3_SOURCE_BUCKET,
          Key: srcKey
        },
        next);
      },
    function transform(response, next) {
      gm(response.Body).size(function(err, size) {
        // Infer the scaling factor to avoid stretching the image unnaturally.
        var scalingFactor = Math.min(
          MAX_WIDTH / size.width,
          MAX_HEIGHT / size.height
        );
        var width  = scalingFactor * size.width;
        var height = scalingFactor * size.height;

        // Transform the image buffer in memory.
        this.resize(width, height)
          .toBuffer(imageType, function(err, buffer) {
            if (err) {
              next(err);
            } else {
              next(null, response.ContentType, buffer);
            }
          });
      });
    },
    function upload(contentType, data, next) {
      // Stream the transformed image to a different S3 bucket.
      s3.putObject({
          Bucket: S3_TARGET_BUCKET,
          Key: dstKey,
          Body: data,
          ContentType: contentType
        },
        next);
      }
    ], function (err) {
      if (err) {
        console.error(
          'Unable to resize ' + S3_SOURCE_BUCKET + '/' + srcKey +
          ' and upload to ' + S3_TARGET_BUCKET + '/' + dstKey +
          ' due to an error: ' + err
        );
      } else {
        console.log(
          'Successfully resized ' + S3_SOURCE_BUCKET + '/' + srcKey +
          ' and uploaded to ' + S3_TARGET_BUCKET + '/' + dstKey
        );
      }

      context.done();
    }
  );
};
