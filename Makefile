netlify:
	@echo Building Netlify website
	make netlify-yarn-install
	make netlify-clean
	make netlify-build-modules

netlify-clean:
	@echo Cleanup
	(yarn workspaces foreach --verbose --topological-dev run clean)

netlify-yarn-install:
	@echo Perform yarn install
	(yarn install)

netlify-build-modules:
	@echo Build all modules
	(yarn workspaces foreach --verbose --topological-dev run build)
