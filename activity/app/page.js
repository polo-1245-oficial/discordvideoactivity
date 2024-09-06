'use client'
import { useState, useEffect } from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';
import Player from '../components/Player';

export default function Home() {
	let auth;
	const [lastWatched, setLastWatched] = useState(null);
	const botid = "1108074741731954740"; //+ organización
	
	const discordSdk = new DiscordSDK(botid);

	useEffect(() => {
		setupDiscordSdk().then(() => {
			console.log("Discord SDK is authenticated");
			video();
		});
	}, []);

	async function setupDiscordSdk() {
		await discordSdk.ready();
		console.log("Discord SDK is ready");

		const { code } = await discordSdk.commands.authorize({
			client_id: botid,
			response_type: "code",
			state: "",
			prompt: "none",
			scope: [
				"identify"
			],
		});
		const response = await fetch("/.proxy/api/api/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				code,
			}),
		});
		const { access_token } = await response.json();

		auth = await discordSdk.commands.authenticate({
			access_token,
		});

		if (auth == null) {
			throw new Error("Authenticate command failed");
		}
	}

	async function video() {
		try {
			const app = document.querySelector('#app');

			const user = await fetch(`https://discord.com/api/v10/users/@me`, {
				headers: {
					Authorization: `Bearer ${auth.access_token}`,
					'Content-Type': 'application/json',
				},
			}).then((response) => response.json());
			console.log("user", user);
			const id = user.id;
			console.log("id", id);

			if (!id) {
				throw new Error("No hay id");
			}
			//la gran mayoría de cosas del SDK de discord están sacadas de https://www.npmjs.com/package/@discord/embedded-app-sdk y discord.dev
			const lastWatchedData = await fetch(`/.proxy/watch/lastWatched/${id}`, {
				headers: {
					'Content-Type': 'application/json',
				},
			}).then((response) => {
				if (!response.ok) {
					console.log("error "+response);
					
					throw new Error("error en la api");
				}
				return response.json();
			});

			setLastWatched(lastWatchedData);
		} catch (error) {
			console.error(error);
		}
	}


	return (
		<main className="flex items-center justify-center min-h-screen">
			{lastWatched ? (
				<div className="w-full max-w-6xl aspect-video">
					<Player videoUrl={lastWatched.episodeurl} />
				</div>
			) : (
				<p>Obteniendo información...</p>
			)}
		</main>
	);
}