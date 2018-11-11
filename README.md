<pre>
      _                       _                 _         _
  ___| |__   __ _  ___  ___  | | __ _ _ __ ___ | |__   __| | __ _
 / __| '_ \ / _` |/ _ \/ __| | |/ _` | '_ ` _ \| '_ \ / _` |/ _` |
| (__| | | | (_| | (_) \__ \ | | (_| | | | | | | |_) | (_| | (_| |
 \___|_| |_|\__,_|\___/|___/ |_|\__,_|_| |_| |_|_.__/ \__,_|\__,_|
</pre>

- **Website**: [https://artillery.io/chaos-lambda](https://artillery.io/chaos-lambda)
- **Source**: [https://github.com/shoreditch-ops/chaos-lambda](https://github.com/shoreditch-ops/chaos-lambda)
- **Issues**: [https://github.com/shoreditch-ops/chaos-lambda/issues](https://github.com/shoreditch-ops/chaos-lambda/issues)
- **Twitter**: [@ShoreditchOps](https://twitter.com/ShoreditchOps)

# Meet Chaos Lambda

**Chaos Lambda** is a serverless implementation of Netflix's [Chaos Monkey](https://github.com/Netflix/SimianArmy/wiki/Chaos-Monkey).

It will wreak havoc\* on your AWS infrastructure to help you build systems that are **lean**, **mean**, and **resilient to failure**.

<sub>* - in an extremely controlled manner - Chaos Lambda is **disabled by default**</sub>

# About

Chaos Lambda is a small tool for testing resiliency and recoverability of AWS-based architectures. Once configured and deployed, it will randomly terminate or otherwise interfere<sup>**[*](#features)**</sup> with the operation of your EC2 instances and ECS tasks. It is inspired by Netflix's [Chaos Monkey](https://github.com/Netflix/SimianArmy/wiki/Chaos-Monkey), but instead of requiring an EC2 instance to run on, it uses AWS Lambda. Think of it as Chaos Monkey rebuilt with modern tech.

## Installation

You need [Node.js](https://nodejs.org/en/) to use Chaos Lambda (we will rewrite the CLI in Golang ats some point):

```shell
# npm comes bundled with Node.js
npm install -g chaos-lambda
```

## Setting Up

### AWS Configuration

An IAM user and a role for the lambda need to be set up first.

#### IAM User

Must be set up and credentials set up in `~/.aws/credentials`

#### Lambda Role

Required policies:
- AmazonEC2FullAccess

### Setting up Chaos Lambda

To create the AWS Lambda function run:

```shell
chaos-lambda deploy -r $lambda-role-arn
```

This will create a state file (`chaos_lambda_config.json`) which is needed for
subsequent re-deploys, and deploy Chaos Lambda to AWS. It will be configured
to run once an hour, but it **won't do anything** every time it runs.

To configure termination rules, run `deploy` with a [`Chaosfile`](./Chaosfile.json):

```shell
chaos-lambda deploy -c Chaosfile.json
```

#### Chaosfile.json

Example Chaosfile.json:

```javascript
{
  "interval": "60",
  "enableForASGs": [
  ],
  "disableForASGs": [
  ]
}
```

**Options:**

- `interval` (in minutes) - how frequently Chaos Lambda should run. Minimum
value is `5`. Default value is `60`.
- `enableForASGs` - whitelist of names of ASGs to pick an instance from.
Instances in other ASGs will be left alone. Empty list (`[]`) means Chaos Lambda
won't do anything.
- `disableForASGs` - names of ASGs that should not be touched; instances in any
other ASG are eligible for termination.

If both `enableForASGs` and `disableForASGs` are specified, then only
`enableForASGs` rules are applied.

**Enable/Disable/Status:**
Once deployed you can enable and disable Chaos Lambda without redeploying.
- `chaos-lambda disable` - Will disable Chaos Lambda
- `chaos-lambda enable` - Will enable Chaos Lambda
- `chaos-lambda status` - Will display current status

## Chaos Lambda vs Chaos Monkey

Chaos Lambda is inspired by Netflix’s <a href="https://github.com/Netflix/SimianArmy/wiki/Chaos-Monkey">Chaos Monkey</a>. Curious about the differences? Here’s a handy summary:

| Lambda           | Monkey  |
|:-------------|:-----|
| Serverless (runs on AWS Lambda) - no maintenance | Needs EC2 instances to run on |
| Extremely easy to deploy      | Needs quite a bit of setup and config ([&raquo;&raquo;&raquo;](https://github.com/Netflix/SimianArmy/wiki/Quick-Start-Guide)) |
| Small codebase, easy to understand and extend (<400 SLOC)      | Large codebase (thousands of SLOC) |
| Written in JS | Written in Go |
| New on the scene | Mature project |
| Small feature set | Many features |
| Open source under MPL 2.0 / MIT | Open source under APL 2.0 |
| Developed by [Shoreditch Ops](https://twitter.com/ShoreditchOps) | Developed by Netflix |


## Why Use Chaos Lambda?

> Failures happen, and they inevitably happen when least desired. If your application can't tolerate a system failure would you rather find out by being paged at 3am or after you are in the office having already had your morning coffee? Even if you are confident that your architecture can tolerate a system failure, are you sure it will still be able to next week, how about next month? Software is complex and dynamic, that "simple fix" you put in place last week could have undesired consequences. Do your traffic load balancers correctly detect and route requests around system failures? Can you reliably rebuild your systems? Perhaps an engineer "quick patched" a live system last week and forgot to commit the changes to your source repository?

(source: [Chaos Monkey wiki](https://github.com/Netflix/SimianArmy/wiki/Chaos-Monkey#why-run-chaos-monkey))

Further reading: [Principles Of Chaos Engineering](http://principlesofchaos.org)

## Current Limitations

### Supported AWS Regions

Chaos Lambda will only work in regions that lambda being supported by AWS: [refer AWS regions for Lambda] https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services/


### Features

Right now, Chaos Lambda only knows how to terminate instances and does not support more advanced interference modes, like introducing extra latency (but it's on the roadmap and being worked on, see [Issue #4](https://github.com/shoreditch-ops/chaos-lambda/issues/4)).

## Bonus Points

Want to go further in your pursuit of indestructible systems? Combine Chaos Lambda with stress testing with [Artillery.io](https://artillery.io) to ship systems that just keep going.

## Support

File an [issue](https://github.com/shoreditch-ops/chaos-lambda/issues) or drop us a line on [team@artillery.io](mailto:team@artillery.io).

## Contributing

Please see the [Contributor's Guide](CONTRIBUTING.md)

## License

MPL 2.0 - see [LICENSE.txt](./LICENSE.txt) for details.

The [lambda/index.js](./lambda/index.js) file is dual-licensed under MPL 2.0 and MIT and can be used under the terms of either of those licenses.

## Contributors

- Hassy Veldstra <[h@artillery.io](mailto:h@artillery.io)>

---

<sub>A project by [Shoreditch Ops](https://twitter.com/ShoreditchOps), creators of [artillery.io](https://artillery.io) ⚡️ - simple &amp; powerful load-testing framework.</sub>
