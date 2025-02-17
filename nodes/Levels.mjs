import * as Node from "/Materialism/js/Node.mjs";
import * as Shader from "/Materialism/js/Shader.mjs";
import * as NodeShader from "/Materialism/js/NodeShader.mjs";

let program;
let gl;

const definition = {
	name: "Levels",
	properties: [
		{
			identifier: "input_texture",
			direction: "in",
			dimensions: "2d",
			type: "color",
			constraints: {},
		},
		{
			identifier: "shadows",
			direction: "in",
			dimensions: "2d",
			type: "color",
			default: 0.0,
			constraints: { min: 0, max: 1 }
		},
		{
			identifier: "midtones",
			direction: "in",
			dimensions: "2d",
			type: "color",
			default: 0.5,
			constraints: { min: 0, max: 1 }
		},
		{
			identifier: "highlights",
			direction: "in",
			dimensions: "2d",
			type: "color",
			default: 1.0,
			constraints: { min: 0, max: 1 }
		},
		{
			identifier: "minimums",
			direction: "in",
			dimensions: "2d",
			type: "color",
			default: 0.0,
			constraints: { min: 0, max: 1 }
		},
		{
			identifier: "maximums",
			direction: "in",
			dimensions: "2d",
			type: "color",
			default: 1.0,
			constraints: { min: 0, max: 1 }
		},
		{
			identifier: "output_texture",
			direction: "out",
			dimensions: "2d",
			type: "color",
		},
	],
	rows: [
		{
			name: "output_thumbnail",
			type: "Thumbnail",
			connectors: [
				{ identifier: "input_texture", direction: "in", dimensions: "2d", type: "color" },
				{ identifier: "output_texture", direction: "out", dimensions: "2d", type: "color" },
			],
			options: {
				outputBoundIdentifier: "output_texture",
			},
		},
		{ type: "Spacer" },
		{
			name: "input_shadows",
			type: "Input",
			connectors: [
				{ identifier: "shadows", direction: "in", dimensions: "0d", type: "float" },
			],
			options: {
				label: "Shadows",
				inputBoundIdentifier: "shadows",
			},
			data: {},
		},
		{
			name: "input_midtones",
			type: "Input",
			connectors: [
				{ identifier: "midtones", direction: "in", dimensions: "0d", type: "float" },
			],
			options: {
				label: "Midtones (Interp Factor)",
				inputBoundIdentifier: "midtones",
			},
			data: {},
		},
		{
			name: "input_highlights",
			type: "Input",
			connectors: [
				{ identifier: "highlights", direction: "in", dimensions: "0d", type: "float" },
			],
			options: {
				label: "Highlights",
				inputBoundIdentifier: "highlights",
			},
			data: {},
		},
		{ type: "Spacer" },
		{
			name: "output_minimums",
			type: "Input",
			connectors: [
				{ identifier: "minimums", direction: "in", dimensions: "0d", type: "float" },
			],
			options: {
				label: "Minimums",
				inputBoundIdentifier: "minimums",
			},
			data: {},
		},
		{
			name: "output_maximums",
			type: "Input",
			connectors: [
				{ identifier: "maximums", direction: "in", dimensions: "0d", type: "float" },
			],
			options: {
				label: "Maximums",
				inputBoundIdentifier: "maximums",
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

	const loadingProgram = Shader.createProgram(gl, "Billboard.vert.glsl", "Levels.frag.glsl");
	loadingProgram.then((createdProgram) => {
		program = createdProgram;
	});
	return loadingProgram;
}

export function compute(nodeData) {
	// Set up render data
	const resolution = [512, 512];
	const uniforms = {
		u_shadows: { value: Node.getInPropertyValue(nodeData, "shadows"), type: "float", vector: false, location: null },
		u_midtones: { value: Node.getInPropertyValue(nodeData, "midtones"), type: "float", vector: false, location: null },
		u_highlights: { value: Node.getInPropertyValue(nodeData, "highlights"), type: "float", vector: false, location: null },
		u_minimums: { value: Node.getInPropertyValue(nodeData, "minimums"), type: "float", vector: false, location: null },
		u_maximums: { value: Node.getInPropertyValue(nodeData, "maximums"), type: "float", vector: false, location: null },
	};
	const textures = {
		u_input: { value: Node.getInPropertyValue(nodeData, "input_texture"), location: null },
	};

	NodeShader.initializeProgram(gl, program, resolution, uniforms, textures); // TODO: Should only be called once
	const framebuffer = NodeShader.renderToTexture(gl, program, resolution, uniforms);
	NodeShader.composite(gl, program, resolution, uniforms, textures);
	const image = NodeShader.readRenderedTexture(gl, framebuffer, resolution);

	Node.setPropertyValue(nodeData, "output_texture", image);
}
