<script lang="ts">
	import '../app.css';
	import Header from './Header.svelte';
	import Footer from './Footer.svelte';
</script>

<svelte:head>
	<title>Hỗ trợ xếp lịch tín chỉ KMA</title>
	<meta name="description" content="KMA Tín Chỉ" />
	<link
		rel="shortcut icon"
		href="https://avatars1.githubusercontent.com/u/46277436"
		type="image/png"
	/>
</svelte:head>
<div class="app">
	<Header />

	<main>
		<slot />
	</main>

	<Footer />
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 72rem;
		min-width: 60rem;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>
