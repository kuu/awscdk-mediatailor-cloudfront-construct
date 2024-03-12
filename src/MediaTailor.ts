import * as crypto from 'crypto';
import { Fn } from 'aws-cdk-lib';
import { CfnPlaybackConfiguration } from 'aws-cdk-lib/aws-mediatailor';
import { Construct } from 'constructs';

export interface MediaTailorProps {
  readonly videoContentSourceUrl: string;
  readonly adDecisionServerUrl: string;
  readonly slateAdUrl?: string;
}

export class MediaTailor extends Construct {
  public readonly config: CfnPlaybackConfiguration;

  constructor(scope: Construct, id: string, {
    videoContentSourceUrl,
    adDecisionServerUrl,
    slateAdUrl,
  }: MediaTailorProps) {

    super(scope, id);

    const arr = Fn.split('/', videoContentSourceUrl);

    // Create EMT config
    this.config = new CfnPlaybackConfiguration(this, 'CfnPlaybackConfiguration', {
      name: `${crypto.randomUUID()}`,
      videoContentSourceUrl: `https://${Fn.select(2, arr)}/${Fn.select(3, arr)}/${Fn.select(4, arr)}/${Fn.select(5, arr)}/`, // Ugly
      adDecisionServerUrl,
      slateAdUrl,
    });
  }
}