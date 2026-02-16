<svelte:head>
	<link rel="stylesheet" href="https://wisconsinwatch.org/wp-content/themes/newspack-theme/style.css?ver=2.17.0">
	<link rel="stylesheet" href="{base}/css/wp-custom.css">
	<script src="https://pym.nprapps.org/pym.v1.min.js"></script>
	<style>
		.race-detail {
			max-width: 900px;
			margin: 0 auto;
			padding: 2rem 1rem;
		}
		
		.race-header {
			text-align: center;
			margin-bottom: 2rem;
			padding: 2rem;
			background-color: #f5f5f5;
			border-radius: 8px;
		}
		
		.race-header h1 {
			margin: 0 0 0.5rem 0;
			color: #0073aa;
		}
		
		.info-section {
			margin: 2rem 0;
			background-color: white;
			border: 1px solid #ddd;
			border-radius: 8px;
			padding: 1.5rem;
		}
		
		.info-section h2 {
			color: #0073aa;
			border-bottom: 2px solid #0073aa;
			padding-bottom: 0.5rem;
			margin-top: 0;
		}
		
		.candidates-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
			gap: 1.5rem;
			margin-top: 1.5rem;
		}
		
		.candidate-card {
			background-color: white;
			border: 2px solid #0073aa;
			border-radius: 8px;
			padding: 1.5rem;
			text-align: center;
			text-decoration: none;
			color: inherit;
			transition: all 0.3s ease;
			display: flex;
			flex-direction: column;
			align-items: center;
		}
		
		.candidate-card:hover {
			transform: translateY(-4px);
			box-shadow: 0 4px 12px rgba(0, 115, 170, 0.3);
			border-color: #005a87;
		}
		
		.candidate-photo {
			width: 150px;
			height: 150px;
			border-radius: 50%;
			object-fit: cover;
			margin-bottom: 1rem;
		}
		
		.candidate-placeholder {
			width: 150px;
			height: 150px;
			border-radius: 50%;
			background-color: #e0e0e0;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 3rem;
			color: #999;
			margin-bottom: 1rem;
		}
		
		.candidate-name {
			font-size: 1.5rem;
			font-weight: bold;
			color: #333;
			margin: 0.5rem 0;
		}
		
		.candidate-party {
			color: #666;
			font-size: 1.1rem;
			margin: 0.25rem 0;
		}
		
		.candidate-occupation {
			color: #777;
			font-size: 0.95rem;
			margin-top: 0.5rem;
		}
		
		.back-button {
			display: inline-block;
			margin-bottom: 1rem;
			padding: 0.75rem 1.5rem;
			background-color: #0073aa;
			color: white !important;
			text-decoration: none;
			border-radius: 4px;
			transition: background-color 0.2s;
		}
		
		.back-button:hover {
			background-color: #005a87;
		}
		
		.loading-message {
			text-align: center;
			padding: 2rem;
		}
		
		.error-message {
			text-align: center;
			padding: 2rem;
			color: red;
		}
		
		@media (max-width: 768px) {
			.candidates-grid {
				grid-template-columns: 1fr;
			}

			.race-detail {
				padding: 0rem 0.5rem;
			}
		}
	</style>
</svelte:head>

<script>
    import { base } from '$app/paths';
    import { onMount, afterUpdate } from 'svelte';
    import { afterNavigate, goto } from '$app/navigation';
    import { fetchCandidatesFromAPI } from '$lib/googleSheets.js';
    
    let candidates = [];
    let loading = true;
    let error = null;
    
    let pymChild;
    let contentElement;
    
    async function fetchCandidates() {
        try {
            candidates = await fetchCandidatesFromAPI('Supreme Court');
            loading = false;
        } catch (e) {
            error = e.message;
            loading = false;
            console.error('Error fetching candidates:', e);
        }
    }
    
    onMount(() => {
        fetchCandidates();
        
        if (typeof window !== 'undefined' && window.pym) {
            pymChild = new window.pym.Child();
        }
    });
    
    afterUpdate(() => {
        if (pymChild && pymChild.sendHeight) {
            pymChild.sendHeight();
        }
    });
    
    afterNavigate(() => {
        if (pymChild && pymChild.sendHeight) {
            pymChild.sendHeight();
        }
    });
</script>

<div id="content" class="site-content" bind:this={contentElement}>
    <section id="primary" class="content-area">
        <main id="main" class="site-main" role="main">
            <div class="race-detail">
                <button class="back-button" on:click={() => goto(`${base}/`)}>← Back to Main Page</button>
                
                {#if loading}
                    <div class="loading-message">
                        <p>Loading candidates...</p>
                    </div>
                {:else if error}
                    <div class="error-message">
                        <p>Error: {error}</p>
                    </div>
                {:else}
                    <div class="race-header">
                        <h1>Wisconsin Supreme Court Race</h1>
                    </div>
                    
                    <div class="info-section">
                        <h2>Candidates</h2>
                        <div class="candidates-grid">
                            {#each candidates as candidate}
                                <a href="{base}/wisconsin-supreme-court/{candidate.id}" class="candidate-card">
                                    {#if candidate.image}
                                        <img src={candidate.image} alt={candidate.name} class="candidate-photo" />
                                    {:else}
                                        <div class="candidate-placeholder">?</div>
                                    {/if}
                                    <div class="candidate-name">{candidate.name}</div>
                                    {#if candidate.party}
                                        <div class="candidate-party">{candidate.party}</div>
                                    {/if}
                                    {#if candidate.occupation}
                                        <div class="candidate-occupation">{candidate.occupation}</div>
                                    {/if}
                                </a>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        </main>
    </section>
</div>
