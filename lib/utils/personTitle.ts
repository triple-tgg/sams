/**
 * Name-title (คำนำหน้าชื่อ) helpers.
 *
 * The staff record keeps a single `title` that may be stored in English ("Mr.") or Thai ("นาย"),
 * while documents print the Thai and English names separately — each needs its own language's title.
 */

const TITLE_PAIRS: { th: string; en: string; aliases: string[] }[] = [
    { th: 'นาย', en: 'Mr.', aliases: ['mr', 'mister', 'นาย'] },
    { th: 'นาง', en: 'Mrs.', aliases: ['mrs', 'นาง'] },
    { th: 'นางสาว', en: 'Ms.', aliases: ['ms', 'miss', 'น.ส.', 'นส', 'นางสาว'] },
    { th: 'ดร.', en: 'Dr.', aliases: ['dr', 'doctor', 'ดร.', 'ดร'] },
    { th: 'กัปตัน', en: 'Capt.', aliases: ['capt', 'captain', 'กัปตัน'] },
]

const normalize = (value: string) => value.trim().toLowerCase().replace(/\.$/, '')

function findPair(title: string | null | undefined) {
    if (!title) return undefined
    const key = normalize(title)
    return TITLE_PAIRS.find((p) => p.aliases.some((a) => normalize(a) === key))
}

/** "Mr." / "นาย" → "นาย". Unknown titles are returned as-is. */
export function toThaiTitle(title: string | null | undefined): string {
    if (!title) return ''
    return findPair(title)?.th ?? title.trim()
}

/** "นาย" / "Mr" → "Mr.". Unknown titles are returned as-is. */
export function toEnglishTitle(title: string | null | undefined): string {
    if (!title) return ''
    return findPair(title)?.en ?? title.trim()
}

/**
 * Remove the record's own title if it was also typed into the name
 * ("Mr. Decha" → "Decha", "นายเดชา" → "เดชา"). Only that title's spellings are stripped, so a
 * Thai first name that merely starts like a title (e.g. "นางนวล" with title "Mr.") is left alone.
 */
export function stripTitle(name: string, title?: string | null): string {
    const trimmed = name.trim()
    const pair = findPair(title)
    if (!pair) return trimmed
    const prefixes = [pair.th, pair.en, ...pair.aliases]
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .sort((x, y) => y.length - x.length)
    for (const prefix of prefixes) {
        const isThai = /[\u0E00-\u0E7F]/.test(prefix)
        // Thai titles are written without a space; English ones are followed by a dot and/or space.
        const re = isThai
            ? new RegExp(`^${escapeRegExp(prefix)}\\s*`)
            : new RegExp(`^${escapeRegExp(prefix.replace(/\.$/, ''))}\\.?\\s+`, 'i')
        if (re.test(trimmed)) return trimmed.replace(re, '').trim()
    }
    return trimmed
}

/** Thai name with its Thai title: ("Mr.", "สัณห์มนัส เรืองศรี") → "นายสัณห์มนัส เรืองศรี". */
export function formatThaiName(title: string | null | undefined, name: string | null | undefined): string {
    if (!name?.trim()) return ''
    const t = toThaiTitle(title)
    const bare = stripTitle(name, title)
    // Thai convention: the title is joined to the name; unknown/long titles keep a space
    return t ? (findPair(title) ? `${t}${bare}` : `${t} ${bare}`) : bare
}

/** English name with its English title: ("นาย", "Sanmanas Ruangsri") → "Mr. Sanmanas Ruangsri". */
export function formatEnglishName(title: string | null | undefined, name: string | null | undefined): string {
    if (!name?.trim()) return ''
    const t = toEnglishTitle(title)
    const bare = stripTitle(name, title)
    return t ? `${t} ${bare}` : bare
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
