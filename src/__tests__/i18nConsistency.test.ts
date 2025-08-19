import { translations } from '../locales';

describe('i18n consistency (full parity)', () => {
	const langs = Object.keys(translations) as Array<keyof typeof translations>;
	const base = 'EN' as keyof typeof translations;
	const baseKeys = new Set(Object.keys(translations[base]));

	it('all languages have exactly the same set of keys as EN', () => {
		langs.forEach((lang) => {
			const keys = new Set(Object.keys(translations[lang]));
			const missing = [...baseKeys].filter((k) => !keys.has(k));
			const extra = [...keys].filter((k) => !baseKeys.has(k));
			expect({ lang, missing, extra }).toEqual({ lang, missing: [], extra: [] });
		});
	});
});

