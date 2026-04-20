import type { Generator } from "./shared.js";

/**
 * Git config file generator (.git/config)
 */
export const gitConfigGenerator: Generator = (ctx) => {
	const { helpers } = ctx;
	const domain = helpers.fakeDomain();

	const sections = [
		"[core]",
		"\trepositoryformatversion = 0",
		"\tfilemode = true",
		"\tbare = false",
		"\tlogallrefupdates = true",
		"",
		'[remote "origin"]',
		`\turl = https://${helpers.fakeEmail().split("@")[0]}:${helpers.fakeApiToken()}@github.com/${domain.split(".")[0]}/app.git`,
		"\tfetch = +refs/heads/*:refs/remotes/origin/*",
		"",
		'[branch "main"]',
		"\tremote = origin",
		"\tmerge = refs/heads/main",
		"",
		"[user]",
		`\tname = ${helpers.fakeEmail().split("@")[0]}`,
		`\temail = ${helpers.fakeEmail()}`,
		"",
		`# Production repository: ${domain}`,
		`# Last sync: ${helpers.fakeTimestamp()}`,
	];

	return sections.join("\n");
};

/**
 * Git HEAD file generator (.git/HEAD)
 */
export const gitHeadGenerator: Generator = () => {
	return "ref: refs/heads/main";
};
