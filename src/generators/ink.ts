import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { rmSync } from "node:fs";
import * as Generator from "yeoman-generator";
const debug = require("debug")("generator-ink");

let hasYarn = false;
try {
  execSync("yarn -v", { stdio: "ignore" });
  hasYarn = true;
} catch {
  debug("No yarn detected..");
}

export default class Ink extends Generator {
  options: {
    defaults?: boolean;
    yarn: boolean;
  };

  name: string;

  constructor(args: string | string[], opts: Generator.GeneratorOptions) {
    super(args, opts);
    this.name = opts.name;
    this.options = {
      defaults: opts.defaults,
      yarn: hasYarn,
    };
  }

  async initializing(): Promise<void> {
    this.log("Checking dependencies...");

    const dependencyChecks = {
      rust: "rustc --version",
      cargo: "cargo -V",
      "cargo contract": "cargo contract -V",
    };

    Object.entries(dependencyChecks).forEach(([dependency, command]) => {
      try {
        execSync(command, { stdio: "ignore" });
        this.log.ok(`Checking ${dependency}`);
      } catch {
        // TODO: put astar docs link here
        this.log.error(
          `"${dependency}" is not installed. Please follow the guide:
          https://docs.substrate.io/tutorials/v3/ink-workshop/pt1/#update-your-rust-environment`
        );
        process.exit(1);
      }
    });
  }

  async prompting(): Promise<void> {
    const { contractTemplate } = await this.prompt({
      name: "contractTemplate",
      type: "list",
      message: "Which template should we use?",
      choices: [
        { name: "Blank", value: "master" },
        { name: "Flipper", value: "flipper" },
        { name: "Dual contract", value: "dual-contract" },
      ],
    });

    execSync(
      `git clone -b ${contractTemplate} --single-branch https://github.com/AstarNetwork/swanky-template-ink.git "${resolve(
        this.name
      )}"`,
      { stdio: "ignore" }
    );
    this.log.ok("Cloning template repository...");

    rmSync(`${resolve(this.name, ".git")}`, { recursive: true });
  }

  async writing(): Promise<void> {}
}
