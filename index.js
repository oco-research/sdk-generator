const sodium = require('tweetsodium');
const github = require('@actions/github');

async function run () {
    const octokit = github.getOctokit(process.env.INPUT_GITHUB_TOKEN)
    const publicKeyResponse = await octokit.rest.actions.getRepoPublicKey({
        owner: process.env.INPUT_GITHUB_OWNER,
        repo: process.env.INPUT_GITHUB_REPO
    });
    const publicKeyData = publicKeyResponse.data;
    const variablesToSet = {}

    if (process.env.INPUT_PACKAGE_TOKEN) {
        variablesToSet['PACKAGE_TOKEN'] = process.env.INPUT_PACKAGE_TOKEN;
    }

    if (process.env.INPUT_PACKAGE_USERNAME) {
        variablesToSet['PACKAGE_USERNAME'] = process.env.INPUT_PACKAGE_USERNAME;
    }

    Object.keys(variablesToSet).forEach(key => {
        const value = variablesToSet[key]
        const messageBytes = Buffer.from(value);
        const keyBytes = Buffer.from(publicKeyData.key, 'base64');
        const encryptedBytes = sodium.seal(messageBytes, keyBytes);
        const encrypted = Buffer.from(encryptedBytes).toString('base64');

        octokit.rest.actions.createOrUpdateRepoSecret({
            owner: process.env.INPUT_GITHUB_OWNER,
            repo: process.env.INPUT_GITHUB_REPO,
            secret_name: key,
            encrypted_value: encrypted,
            key_id: publicKeyData.key_id
        })
    })
}

run();

