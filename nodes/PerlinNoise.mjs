import * as Node from "/Materialism/js/Node.mjs";
import * as Shader from "/Materialism/js/Shader.mjs";
import * as NodeShader from "/Materialism/js/NodeShader.mjs";

let program;
let gl;

const definition = {
	// Defines the node name shown in its header
	name: "Perlin Noise",
	// Defines input and output data model properties
	properties: [
		{
			identifier: "scale",
			direction: "in",
			dimensions: "0d",
			type: "float",
			default: 10,
			constraints: { min: 1 },
		},
		{
			identifier: "seed",
			direction: "in",
			dimensions: "0d",
			type: "int",
			default: 0,
			constraints: {},
		},
		{
			identifier: "pattern",
			direction: "out",
			dimensions: "2d",
			type: "color",
		},
	],
	// Defines GUI layout information and its bindings to the data model
	rows: [
		{
			// Unique identifier for this row in the node definition
			name: "perlin_noise_thumbnail",
			// The widget type for the row to be rendered as
			type: "Thumbnail",
			// List of any connector dots hosted on the input and output sides of the row
			connectors: [
				{ identifier: "pattern", direction: "out", dimensions: "2d", type: "color" },
			],
			// Option specific to the widget type
			options: {
				// Tells the thumbnail which output property identifier read its value from to display
				outputBoundIdentifier: "pattern",
			},
		},
		{ type: "Spacer" },
		{
			name: "perlin_noise_scale",
			type: "Input",
			options: {
				// Tells the input what label to print
				label: "Scale",
				// Tells the input what in property identifier feed with its value
				inputBoundIdentifier: "scale",
			},
			connectors: [
				{ identifier: "scale", direction: "in", dimensions: "0d", type: "float" },
			],
			data: {},
		},
		{
			name: "random_seed",
			type: "Input",
			connectors: [
				{ identifier: "seed", direction: "in", dimensions: "0d", type: "int" },
			],
			options: {
				label: "Seed",
				inputBoundIdentifier: "seed",
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

	const loadingProgram = Shader.createProgram(gl, "Billboard.vert.glsl", "PerlinNoise.frag.glsl");
	loadingProgram.then((createdProgram) => {
		program = createdProgram;
	});
	return loadingProgram;
}

export function compute(nodeData) {
	// Prepare new render data
	const resolution = [512, 512];
	const uniforms = {
		u_scale: { value: Node.getInPropertyValue(nodeData, "scale"), type: "float", vector: false, location: null },
		u_seed: { value: Node.getInPropertyValue(nodeData, "seed"), type: "int", vector: false, location: null },
	};

	NodeShader.initializeProgram(gl, program, resolution, uniforms);
	const framebuffer = NodeShader.renderToTexture(gl, program, resolution, uniforms);
	NodeShader.composite(gl, program, resolution, uniforms);
	const image = NodeShader.readRenderedTexture(gl, framebuffer, resolution);

	Node.setPropertyValue(nodeData, "pattern", image);
}
