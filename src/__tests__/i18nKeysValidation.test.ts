import { translations } from '../locales';

describe('i18n values (full)', () => {
	it('no translation value is empty/whitespace', () => {
		for (const [lang, dict] of Object.entries(translations)) {
			for (const [k, v] of Object.entries(dict)) {
				const str = String(v ?? '');
				expect({ lang, key: k, empty: !str || !str.trim() }).toEqual({ lang, key: k, empty: false });
			}
		}
	});
});

