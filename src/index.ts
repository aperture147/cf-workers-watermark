import { PhotonImage, watermark } from "@cf-wasm/photon";

let WATERMARK_IMAGE: PhotonImage | null = null

const _getWatermarkImage = async (url: string) => {
	if (!WATERMARK_IMAGE) {
		const resp = await fetch(url)
		console.log('watermark loaded')
		WATERMARK_IMAGE = PhotonImage.new_from_byteslice(new Uint8Array(await resp.arrayBuffer()))
	}
	return WATERMARK_IMAGE
}

const getWatermarkedImageResponse = async (url: string): Promise<Response> => {
	const imageResponse = await fetch(url)
	const image = PhotonImage.new_from_byteslice(new Uint8Array(await imageResponse.arrayBuffer()))
	// NOTE: 
	// Temporally use lorem picsum.
	// In reality I use a watermark image from a base64 string and use
	// `PhotonImage.new_from_base64` to create the image.
	const watermarkImage = await _getWatermarkImage('https://picsum.photos/id/237/200/200')
	const xOffset = BigInt(image.get_width() - watermarkImage.get_width())
	const yOffset = BigInt(image.get_height() - watermarkImage.get_height())
	watermark(image, watermarkImage, xOffset, yOffset)
	const response = new Response(image.get_bytes_webp(), imageResponse)
	response.headers.set("Content-Type", "image/webp")
	image.free()
	return response
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url)
		const imageURL = url.searchParams.get("url")
		if (!imageURL) return new Response("url parameter is required", { status: 400 })
			
		const cache = caches.default
		let response = await cache.match(imageURL, { ignoreMethod: true })
		if (response !== undefined) {
			console.log('cache hit')
			return response
		}
		console.log('cache missed')
		response = await getWatermarkedImageResponse(imageURL)
		response.headers.set("Cache-Control", "public, max-age=31536000, s-maxage=31536000")
		ctx.waitUntil(cache.put(imageURL, response.clone()))
		return response
	},
} satisfies ExportedHandler<Env>;
