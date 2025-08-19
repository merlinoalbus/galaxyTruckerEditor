import { translations } from '../locales';

describe('toolbar coverage smoke', () => {
	it('has mission category and MOBS tool description for all languages', () => {
		for (const [lang, dict] of Object.entries(translations)) {
			expect(dict['visualFlowEditor.tools.category.mission']).toBeTruthy();
			expect(dict['visualFlowEditor.tools.modifyOpponentsBuildSpeed.description']).toBeTruthy();
		}
	});
});
