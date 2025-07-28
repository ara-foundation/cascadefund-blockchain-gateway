import { cwd } from "process";
import path from "path";
import fs from "fs";

type PackageJSON = {
  name: string;
  devDependencies?: {
    [key: string]: string
  },
  dependencies?: {
    [key: string]: string
  },
}

export function getPurls(): string[] {
    const url = path.join(cwd(), './package.json');
    const packageJSON = JSON.parse(fs.readFileSync(url, { encoding: 'utf-8' })) as PackageJSON;
    let deps: string[] = [];
    if (packageJSON.dependencies) {
        deps = Object.keys(packageJSON.dependencies).map(dep => `pkg:npm/${dep}@latest`);
    }
    if (packageJSON.devDependencies) {
        const devDeps = Object.keys(packageJSON.devDependencies).map(dep => `pkg:npm/${dep}@latest`);
        deps = deps.concat(...devDeps);
    }
    return deps;
}

export function getFirstPurl(): string|undefined {
    const purls = getPurls();
    if (purls.length === 0) {
        return undefined;
    }
    return purls[0];
}
