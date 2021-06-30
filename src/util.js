function escapeRegex(str) {
	return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

function disambiguation(items, label, property = 'name') {
	const itemList = items.map(item => `"${(property ? item[property] : item).replace(/ /g, '\xa0')}"`).join(',   ');
	return `Multiple ${label} found, please be more specific: ${itemList}`;
}

function paginate(items, page = 1, pageLength = 10) {
	const maxPage = Math.ceil(items.length / pageLength);
	if(page < 1) page = 1;
	if(page > maxPage) page = maxPage;
	const startIndex = (page - 1) * pageLength;
	return {
		items: items.length > pageLength ? items.slice(startIndex, startIndex + pageLength) : items,
		page,
		maxPage,
		pageLength
	};
}

const permissions = {
	ADMINISTRATOR: 'Administrator',
	VIEW_AUDIT_LOG: 'View audit log',
	MANAGE_GUILD: 'Manage server',
	MANAGE_ROLES: 'Manage roles',
	MANAGE_CHANNELS: 'Manage channels',
	KICK_MEMBERS: 'Kick members',
	BAN_MEMBERS: 'Ban members',
	CREATE_INSTANT_INVITE: 'Create instant invite',
	CHANGE_NICKNAME: 'Change nickname',
	MANAGE_NICKNAMES: 'Manage nicknames',
	MANAGE_EMOJIS: 'Manage emojis',
	MANAGE_WEBHOOKS: 'Manage webhooks',
	VIEW_CHANNEL: 'Read text channels and see voice channels',
	SEND_MESSAGES: 'Send messages',
	SEND_TTS_MESSAGES: 'Send TTS messages',
	MANAGE_MESSAGES: 'Manage messages',
	EMBED_LINKS: 'Embed links',
	ATTACH_FILES: 'Attach files',
	READ_MESSAGE_HISTORY: 'Read message history',
	MENTION_EVERYONE: 'Mention everyone',
	USE_EXTERNAL_EMOJIS: 'Use external emojis',
	ADD_REACTIONS: 'Add reactions',
	CONNECT: 'Connect',
	SPEAK: 'Speak',
	MUTE_MEMBERS: 'Mute members',
	DEAFEN_MEMBERS: 'Deafen members',
	MOVE_MEMBERS: 'Move members',
	USE_VAD: 'Use voice activity'
};


// Discord.JS Utils

/**
 * Data that can be resolved to give a string. This can be:
 * * A string
 * * An array (joined with a new line delimiter to give a string)
 * * Any value
 * @typedef {string|Array|*} StringResolvable
 */

/**
 * Resolves a StringResolvable to a string.
 * @param {StringResolvable} data The string resolvable to resolve
 * @returns {string}
 */
function resolveString(data) {
	if(typeof data === 'string') return data;
	if(Array.isArray(data)) return data.join('\n');
	return String(data);
}
/**
 * Escapes any Discord-flavour markdown in a string.
 * @param {string} text Content to escape
 * @param {Object} [options={}] What types of markdown to escape
 * @param {boolean} [options.codeBlock=true] Whether to escape code blocks or not
 * @param {boolean} [options.inlineCode=true] Whether to escape inline code or not
 * @param {boolean} [options.bold=true] Whether to escape bolds or not
 * @param {boolean} [options.italic=true] Whether to escape italics or not
 * @param {boolean} [options.underline=true] Whether to escape underlines or not
 * @param {boolean} [options.strikethrough=true] Whether to escape strikethroughs or not
 * @param {boolean} [options.spoiler=true] Whether to escape spoilers or not
 * @param {boolean} [options.codeBlockContent=true] Whether to escape text inside code blocks or not
 * @param {boolean} [options.inlineCodeContent=true] Whether to escape text inside inline code or not
 * @returns {string}
 */
function escapeMarkdown(
	text,
	{
		codeBlock = true,
		inlineCode = true,
		bold = true,
		italic = true,
		underline = true,
		strikethrough = true,
		spoiler = true,
		codeBlockContent = true,
		inlineCodeContent = true
	} = {}
) {
	if(!codeBlockContent) {
		return text
			.split('```')
			.map((subString, index, array) => {
				if(index % 2 && index !== array.length - 1) return subString;
				return escapeMarkdown(subString, {
					inlineCode,
					bold,
					italic,
					underline,
					strikethrough,
					spoiler,
					inlineCodeContent
				});
			})
			.join(codeBlock ? '\\`\\`\\`' : '```');
	}
	if(!inlineCodeContent) {
		return text
			.split(/(?<=^|[^`])`(?=[^`]|$)/g)
			.map((subString, index, array) => {
				if(index % 2 && index !== array.length - 1) return subString;
				return escapeMarkdown(subString, {
					codeBlock,
					bold,
					italic,
					underline,
					strikethrough,
					spoiler
				});
			})
			.join(inlineCode ? '\\`' : '`');
	}
	if(inlineCode) text = escapeInlineCode(text);
	if(codeBlock) text = escapeCodeBlock(text);
	if(italic) text = escapeItalic(text);
	if(bold) text = escapeBold(text);
	if(underline) text = escapeUnderline(text);
	if(strikethrough) text = escapeStrikethrough(text);
	if(spoiler) text = escapeSpoiler(text);
	return text;
}

/**
 * Escapes code block markdown in a string.
 * @param {string} text Content to escape
 * @returns {string}
 */
function escapeCodeBlock(text) {
	return text.replace(/```/g, '\\`\\`\\`');
}

/**
 * Escapes inline code markdown in a string.
 * @param {string} text Content to escape
 * @returns {string}
 */
function escapeInlineCode(text) {
	return text.replace(/(?<=^|[^`])`(?=[^`]|$)/g, '\\`');
}

/**
 * Escapes italic markdown in a string.
 * @param {string} text Content to escape
 * @returns {string}
 */
function escapeItalic(text) {
	let i = 0;
	text = text.replace(/(?<=^|[^*])\*([^*]|\*\*|$)/g, (ign, match) => {
		if(match === '**') return ++i % 2 ? `\\*${match}` : `${match}\\*`;
		return `\\*${match}`;
	});
	i = 0;
	return text.replace(/(?<=^|[^_])_([^_]|__|$)/g, (ign, match) => {
		if(match === '__') return ++i % 2 ? `\\_${match}` : `${match}\\_`;
		return `\\_${match}`;
	});
}

/**
 * Escapes bold markdown in a string.
 * @param {string} text Content to escape
 * @returns {string}
 */
function escapeBold(text) {
	let i = 0;
	return text.replace(/\*\*(\*)?/g, (str, match) => {
		if(match) return ++i % 2 ? `${match}\\*\\*` : `\\*\\*${match}`;
		return '\\*\\*';
	});
}

/**
 * Escapes underline markdown in a string.
 * @param {string} text Content to escape
 * @returns {string}
 */
function escapeUnderline(text) {
	let i = 0;
	return text.replace(/__(_)?/g, (str, match) => {
		if(match) return ++i % 2 ? `${match}\\_\\_` : `\\_\\_${match}`;
		return '\\_\\_';
	});
}

/**
 * Escapes strikethrough markdown in a string.
 * @param {string} text Content to escape
 * @returns {string}
 */
function escapeStrikethrough(text) {
	return text.replace(/~~/g, '\\~\\~');
}

/**
 * Escapes spoiler markdown in a string.
 * @param {string} text Content to escape
 * @returns {string}
 */
function escapeSpoiler(text) {
	return text.replace(/\|\|/g, '\\|\\|');
}

module.exports = {
	escapeRegex,
	disambiguation,
	paginate,
	permissions,
	resolveString,
	escapeMarkdown
};
