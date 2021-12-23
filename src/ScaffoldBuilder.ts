import { createAssertion } from "./templates/assertionsTemplate"
import { createComponentRenderFunction } from "./templates/componentRenderingTemplate"
import { createDescribeBlock } from "./templates/describeBlockTemplate"
import { createComponentImport, createDefaultImports, createImport } from "./templates/importTemplate"
import { createMock } from "./templates/mockTemplate"
import { createProp } from "./templates/propTemplate"
import { createResetMocksFunction } from "./templates/resetMocksTemplate"
import { Export, ExportType, ImportBlock } from "./types"
import { getPropsForExport } from "./utils"

class ScaffoldBuilder {
    private name: string
    private exports: Export[]
    private imports: ImportBlock[]

    constructor(name: string) {
        this.name = name.replace(".tsx", "").replace(".ts", "")
        this.exports = []
        this.imports = []
    }

    addExport(element: Export) {
        this.exports.push(element)
    }

    addImport(element: ImportBlock) {
        this.imports.push(element)
    }

    build(): string {
        const jsxExports = this.exports.filter(e => e.element?.returnsJSX === true)
        const mainExport: Export | undefined = jsxExports.find(e => e.isDefault) ?? jsxExports[0]
        const props = mainExport !== undefined
            ? getPropsForExport(mainExport)
            : []

        const mocks = this.imports.filter(i => i.isInternal)

        const importsAsStrings: string[] = []
        importsAsStrings.push(createDefaultImports())
        if (mainExport !== undefined) importsAsStrings.push(createComponentImport(mainExport, this.name))
        importsAsStrings.push(...this.imports.map(i => createImport(i)))
        const importsString = importsAsStrings.join("\n")

        const describeString = createDescribeBlock(this.name)

        const resetMocksString = createResetMocksFunction(props, mocks)

        const mocksString = mocks
            .map(i => createMock(i))
            .join("\n")

        const propsString = props
            .map(p => createProp(p))
            .join("\n")

        const componentRenderString = mainExport !== undefined
            ? createComponentRenderFunction(mainExport.name, props)
            : ""

        const assertionsString = mocks
            .flatMap(m => m.imports)
            .filter(e => e.element?.returnsJSX === true || e.element?.type === ExportType.Function)
            .map(e => createAssertion(e))
            .join("\n")

        return `\
${importsString}


${describeString}
${resetMocksString}
${mocksString}
${propsString}
${componentRenderString}
${assertionsString}
`
    }
}

export default ScaffoldBuilder