import * as crypto from 'crypto';
import { Lazy } from 'aws-cdk-lib';
import {
  CfnPlaybackConfiguration,
} from 'aws-cdk-lib/aws-mediatailor';

import { Construct } from 'constructs';

function removeFilename(url: string): string {
  const lastSlash = url.lastIndexOf('/');
  if (lastSlash === -1) {
    return url;
  }
  return url.substring(0, lastSlash + 1);
}

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

    // Create EMT config
    this.config = new CfnPlaybackConfiguration(this, 'CfnPlaybackConfiguration', {
      name: `${crypto.randomUUID()}`,
      videoContentSourceUrl: Lazy.string({
        produce() {
          return removeFilename(videoContentSourceUrl);
        },
      }),
      adDecisionServerUrl,
      slateAdUrl,
    });
  }
}