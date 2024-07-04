import * as crypto from 'crypto';
import { Aws, Fn } from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { CloudFront } from './CloudFront';
import { MediaTailor } from './MediaTailor';

export interface MediaTailorWithCloudFrontProps {
  readonly videoContentSourceUrl: string; // The URL of the MediaPackage endpoint used by MediaTailor as the content origin.
  readonly adDecisionServerUrl?: string; // The URL of the ad server used by MediaTailor as the ADS.
  readonly slateAdUrl?: string; // The URL of the video file used by MediaTailor as the slate.
  readonly configurationAliases?: object; // The configuration aliases used by MediaTailor.
  readonly adDecisionFunction?: IFunction; // The Lambda function used internally by MediaTailor as the ADS.
  readonly adDecisionFunctionApiPath?: string; // The API path (including query strings) used for accessing the Lambda function.
  readonly skipCloudFront?: boolean; // Skip CloudFront setup.
  readonly adInsertionMode?: 'STITCHED_ONLY' | 'PLAYER_SELECT'; // Whether players can use stitched or guided ad insertion
  readonly prerollAdUrl?: string; // The URL of the video file used by MediaTailor as the preroll.
}

export class MediaTailorWithCloudFront extends Construct {
  public readonly emt: MediaTailor;
  public readonly cf: CloudFront | undefined;

  constructor(scope: Construct, id: string, {
    videoContentSourceUrl,
    adDecisionServerUrl,
    slateAdUrl,
    configurationAliases,
    adDecisionFunction,
    adDecisionFunctionApiPath = '',
    skipCloudFront = false,
    adInsertionMode = 'STITCHED_ONLY',
    prerollAdUrl,
  }: MediaTailorWithCloudFrontProps) {

    super(scope, id);

    if (adDecisionFunction) {
      const api = new LambdaRestApi(this, 'ApGateway', {
        handler: adDecisionFunction,
      });
      adDecisionServerUrl = Fn.join('', [api.url, adDecisionFunctionApiPath]);
    }

    if (!adDecisionServerUrl) {
      throw new Error('Either adDecisionServerUrl or adDecisionFunction is required');
    }

    // Create MediaTailor PlaybackConfig
    this.emt = new MediaTailor(this, 'MediaTailor', {
      videoContentSourceUrl,
      adDecisionServerUrl,
      slateAdUrl,
      configurationAliases,
      prerollAdUrl,
    });

    if (skipCloudFront) {
      return;
    }

    // Create CloudFront Distribution
    this.cf = new CloudFront(this, 'CloudFront', {
      videoContentSourceUrl,
      mediaTailorEndpointUrl: this.emt.config.attrHlsConfigurationManifestEndpointPrefix,
    });

    // Create AWS Custom Resource to setup MediaTailor's CDN configuration with CloudFront
    new AwsCustomResource(this, 'AwsCustomResource', {
      onCreate: {
        service: 'MediaTailor',
        action: 'PutPlaybackConfiguration',
        region: Aws.REGION,
        parameters: {
          Name: this.emt.config.name,
          VideoContentSourceUrl: this.emt.config.videoContentSourceUrl,
          AdDecisionServerUrl: this.emt.config.adDecisionServerUrl,
          LivePreRollAdConfiguration: {
            AdDecisionServerUrl: prerollAdUrl,
          },
          SlateAdUrl: this.emt.config.slateAdUrl,
          CdnConfiguration: {
            AdSegmentUrlPrefix: `https://${this.cf.distribution.distributionDomainName}`,
            ContentSegmentUrlPrefix: `https://${this.cf.distribution.distributionDomainName}/out/v1`,
          },
          InsertionMode: adInsertionMode,
        },
        physicalResourceId: PhysicalResourceId.of(crypto.randomUUID()),
      },
      //Will ignore any resource and use the assumedRoleArn as resource and 'sts:AssumeRole' for service:action
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });
  }
}
