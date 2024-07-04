import { awscdk } from 'projen';
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Kuu Miyazaki',
  authorAddress: 'miyazaqui@gmail.com',
  cdkVersion: '2.147.3',
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.4.25',
  name: 'awscdk-mediatailor-cloudfront-construct',
  projenrcTs: true,
  repositoryUrl: 'https://github.com/kuu/awscdk-mediatailor-cloudfront-construct.git',
  description: 'CDK Construct to associate MediaTailor config with CloudFront distribution',
  keywords: [
    'cdk',
    'cdk-construct',
    'MediaTailor',
    'CloudFront',
  ],
  license: 'MIT',
  licensed: true,

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();
