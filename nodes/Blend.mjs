import * as Node from "/Materialism/js/Node.mjs";
import * as Shader from "/Materialism/js/Shader.mjs";
import * as NodeShader from "/Materialism/js/NodeShader.mjs";

let program;
let gl;

// const blendModeList = [
// 	"Normal", "Dissolve",
// 	"Darken", "Multiply", "Color Burn", "Linear Burn", "Darker Color",
// 	"Lighten", "Screen", "Color Dodge", "Add (Linear Dodge)", "Lighter Color",
// 	"Overlay", "Soft Light", "Hard Light", "Vivid Light", "Linear Light", "Pin Light", "Hard Mix",
// 	"Difference", "Exclusion", "Subtract", "Divide",
// 	"Hue", "Saturation", "Color", "Luminosity",
// ];

const blendModeList = ["Normal", "Dissolve", "Multiply", "Screen", "Add (Linear Dodge)", "Overlay", "Subtract"];

const definition = {
	name: "Blend",
	properties: [
		{
			identifier: "foreground",
			direction: "in",
			dimensions: "2d",
			type: "color",
			constraints: {},
		},
		{
			identifier: "background",
			direction: "in",
			dimensions: "2d",
			type: "color",
			constraints: {},
		},
		{
			identifier: "mode",
			direction: "in",
			dimensions: "0d",
			type: "string",
			default: "Normal",
			constraints: {},
		},
		{
			identifier: "opacity",
			direction: "in",
			dimensions: "2d",
			type: "color",
			default: 0.5,
			constraints: { min: 0, max: 1 }
		},
		{
			identifier: "composite",
			direction: "out",
			dimensions: "2d",
			type: "color",
		},
	],
	rows: [
		{
			name: "composite_thumbnail",
			type: "Thumbnail",
			connectors: [
				{ identifier: "foreground", direction: "in", dimensions: "2d", type: "color" },
				{ identifier: "background", direction: "in", dimensions: "2d", type: "color" },
				{ identifier: "composite", direction: "out", dimensions: "2d", type: "color" },
			],
			options: {
				outputBoundIdentifier: "composite",
			},
		},
		{ type: "Spacer" },
		{
			name: "blend_mode",
			type: "Dropdown",
			connectors: [],
			options: {
				label: "Blend Mode",
				inputBoundIdentifier: "mode",
			},
			data: {
				options: blendModeList,
			},
		},
		{
			name: "opacity_mask",
			type: "Input",
			connectors: [
				{ identifier: "opacity", direction: "in", dimensions: "2d", type: "color" },
			],
			options: {
				label: "Opacity",
				inputBoundIdentifier: "opacity",
			},
			data: {},
		},
	],
};

export function getDefinition() {
	return definition;
}

export function setup() {
	// Create one WebGl context for this node definition
	gl = NodeShader.createGLContext();

	const loadingProgram = Shader.createProgram(gl, "Billboard.vert.glsl", "Blend.frag.glsl");
	loadingProgram.then((createdProgram) => {
		program = createdProgram;
	});
	return loadingProgram;
}

export function compute(nodeData) {
	// Set up render data
	const resolution = [512, 512];
	const uniforms = {
		u_mode: { value: blendModeList.indexOf(Node.getInPropertyValue(nodeData, "mode")), type: "int", vector: false, location: null },
		u_opacity: { value: Node.getInPropertyValue(nodeData, "opacity"), type: "float", vector: false, location: null },
		u_foregroundExists: { value: null, type: "bool", vector: false, location: null },
		u_backgroundExists: { value: null, type: "bool", vector: false, location: null },
	};
	const textures = {
		u_foreground: { value: Node.getInPropertyValue(nodeData, "foreground"), location: null },
		u_background: { value: Node.getInPropertyValue(nodeData, "background"), location: null },
	};

	// TODO: It seems these will always be true
	uniforms.u_foregroundExists.value = Boolean(textures.u_foreground);
	uniforms.u_backgroundExists.value = Boolean(textures.u_background);

	NodeShader.initializeProgram(gl, program, resolution, uniforms, textures); // TODO: Should only be called once
	const framebuffer = NodeShader.renderToTexture(gl, program, resolution, uniforms);
	NodeShader.composite(gl, program, resolution, uniforms, textures);
	const image = NodeShader.readRenderedTexture(gl, framebuffer, resolution);

	Node.setPropertyValue(nodeData, "composite", image);
}
