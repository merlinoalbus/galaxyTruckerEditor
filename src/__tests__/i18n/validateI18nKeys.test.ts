import { translations } from '../../locales';

describe('i18n strict keys (full parity + values)', () => {
	const langs = Object.keys(translations) as Array<keyof typeof translations>;
	const base = 'EN' as keyof typeof translations;
	const baseEntries = Object.entries(translations[base]);

	it('each non-EN language has all EN keys populated (non-empty)', () => {
		for (const lang of langs.filter((l) => l !== base)) {
			for (const [k, _] of baseEntries) {
				const v = translations[lang][k as keyof typeof translations[typeof lang]] as unknown;
				const str = String(v ?? '');
				expect({ lang, key: k, empty: !str || !str.trim() }).toEqual({ lang, key: k, empty: false });
			}
		}
	});
});

