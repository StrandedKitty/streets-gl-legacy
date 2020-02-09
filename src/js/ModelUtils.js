export default class ModelUtils {
	static combineAttributes({primitives}) {
		const attributes = {
			MESH: []
		};
		const indices = [];
		const vertices = [];

		for(let i = 0; i < primitives.length; i++) {
			for(let attributeName in primitives[i].attributes) {
				if(!attributes[attributeName]) attributes[attributeName] = [];
				attributes[attributeName].push(primitives[i].attributes[attributeName].value);
			}

			indices.push(primitives[i].indices.value);
		}

		for(let i = 0; i < attributes.POSITION.length; i++) {
			vertices.push(attributes.POSITION[i].length / 3);
		}

		for(let i = 0; i < vertices.length; i++) {
			attributes.MESH.push(new Uint8Array(vertices[i]).fill(i));
		}

		for(let attributeName in attributes) {
			attributes[attributeName] = this.mergeTypedArrays(attributes[attributeName]);
		}

		const mergedIndices = this.mergeTypedArrays(indices);
		let currentIndex = 0;
		let verticesUsed = 0;

		for(let i = 1; i < indices.length; i++) {
			currentIndex += indices[i - 1].length;
			verticesUsed += vertices[i - 1];

			for(let j = 0; j < indices[i].length; j++) {
				mergedIndices[currentIndex + j] += verticesUsed;
			}
		}

		return {attributes: attributes, indices: mergedIndices};
	}

	static mergeTypedArrays(typedArrays) {
		if(typedArrays.length > 0) {
			let length = 0;

			for(let i = 0; i < typedArrays.length; i++) {
				length += typedArrays[i].length;
			}

			const array = new typedArrays[0].constructor(length);

			let currentLength = 0;

			for(let i = 0; i < typedArrays.length; i++) {
				array.set(typedArrays[i], currentLength);
				currentLength += typedArrays[i].length;
			}

			return array;
		}

		return new Float32Array(0);
	}
}
