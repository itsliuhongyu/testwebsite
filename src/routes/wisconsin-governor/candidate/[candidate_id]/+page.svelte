<svelte:head>
	<link rel="stylesheet" href="https://wisconsinwatch.org/wp-content/themes/newspack-theme/style.css?ver=2.17.0">
	<link rel="stylesheet" href="{base}/css/wp-custom.css">
	<script src="https://pym.nprapps.org/pym.v1.min.js"></script>
	<style>
		.candidate-detail {
			max-width: 900px;
			margin: 0 auto;
			padding: 2rem 1rem;
		}
		
		.candidate-header {
			display: flex;
			gap: 2rem;
			margin-bottom: 2rem;
			flex-wrap: wrap;
		}
		
		.candidate-photo {
			flex: 0 0 300px;
		}
		
		.candidate-photo img {
			width: 100%;
			height: auto;
			border-radius: 8px;
			box-shadow: 0 2px 8px rgba(0,0,0,0.1);
		}
		
		.candidate-basic-info {
			flex: 1;
			min-width: 300px;
		}
		
		.candidate-detail h1 {
			margin-top: 0;
			color: #333;
		}
		
		.info-section {
			margin: 2rem 0;
		}
		
		.info-section h2 {
			color: #0073aa;
			border-bottom: 2px solid #0073aa;
			padding-bottom: 0.5rem;
		}
		
		.info-grid {
			display: grid;
			grid-template-columns: 200px 1fr;
			gap: 1rem;
			margin: 1rem 0;
		}
		
		.info-label {
			font-weight: bold;
			color: #555;
		}
		
		.info-value {
			color: #333;
		}
		

		.contact-links a {
			display: inline-block;
			margin-right: 1rem;
			margin-bottom: 0.5rem;
			color: #0073aa;
			text-decoration: none;
		}
		
		.contact-links a:hover {
			text-decoration: underline;
		}
		
		.placeholder-image {
			width: 100%;
			height: 400px;
			background-color: #e0e0e0;
			border-radius: 8px;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 4rem;
			color: #999;
		}
		
		@media (max-width: 768px) {
			.candidate-header {
				flex-direction: column;
			}
			
			.candidate-photo {
				flex: 1 1 100%;
			}
			
			.info-grid {
				grid-template-columns: 1fr;
			}
		}
	</style>
</svelte:head>

<script>
    import { base } from '$app/paths';
    import { onMount, afterUpdate } from 'svelte';
    import { afterNavigate, goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { getCandidateByCandidateId, fetchRacesFromAPI } from '$lib/googleSheets.js';
    import { loadSourceRace, clearSourceRace } from '$lib/raceStorage.js';
    
    let candidate = null;
    let loading = true;
    let error = null;
    let raceId = null;
    
    let pymChild;
    let contentElement;
    
    function returnToRace() {
        const sourceRace = loadSourceRace();
        if (sourceRace && sourceRace.raceType === 'governor') {
            clearSourceRace();
            goto(`${base}/wisconsin-governor/${sourceRace.raceId}`);
        } else if (raceId) {
            clearSourceRace();
            goto(`${base}/wisconsin-governor/${raceId}`);
        } else {
            clearSourceRace();
            goto(`${base}/`);
        }
    }
    
    async function fetchCandidate() {
        try {
            const candidateId = $page.params.candidate_id;
            candidate = await getCandidateByCandidateId(candidateId, 'Governor');
            
            // Find the race that contains this candidate
            if (candidateId) {
                const races = await fetchRacesFromAPI('Governor');
                const race = races.find(r => 
                    r['candidate-1'] === candidateId || r['candidate-2'] === candidateId
                );
                if (race) {
                    raceId = race['race-id'];
                }
            }
            
            if (!candidate) {
                error = 'Candidate not found';
            }
            
            loading = false;
        } catch (e) {
            error = e.message;
            loading = false;
            console.error('Error fetching candidate:', e);
        }
    }
    
    onMount(() => {
        // Try to load from session storage first
        const sourceRace = loadSourceRace();
        if (sourceRace && sourceRace.raceType === 'governor') {
            raceId = sourceRace.raceId;
        }
        
        fetchCandidate();
        
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
            <div class="candidate-detail">
                {#if raceId}
                    <button class="back-button" on:click={returnToRace}><img src="{base}/graphics/back.svg" alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" /> This Race</button>
                {/if}
                <button class="back-button" style="margin-left: 1rem;" on:click={() => goto(`${base}/`)}><img src="{base}/graphics/back.svg" alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" /> Home</button>
                
                {#if loading}
                    <div style="text-align: center; padding: 2rem;">
                        <p>Loading candidate information...</p>
                    </div>
                {:else if error}
                    <div style="text-align: center; padding: 2rem; color: red;">
                        <p>Error: {error}</p>
                    </div>
                {:else if candidate}
                    <div class="candidate-header">
                        <div class="candidate-photo">
                            {#if candidate.image}
                                <img src={candidate.image} alt={candidate.name} />
                            {:else}
                                <div class="placeholder-image">?</div>
                            {/if}
                        </div>
                        
                        <div class="candidate-basic-info">
                            <h1>{candidate.name}</h1>
                            {#if candidate.party}
                                <p style="font-size: 1.2rem; color: #666; margin: 0.5rem 0;">Party: {candidate.party}</p>
                            {/if}
                            {#if candidate.occupation}
                                <p style="font-size: 1.1rem; color: #555; margin: 0.5rem 0;">Occupation: {candidate.occupation}</p>
                            {/if}
                        </div>
                    </div>
                
                {#if candidate.bio}
                    <div class="info-section">
                        <h2>Biography</h2>
                        <p>{candidate.bio}</p>
                    </div>
                {/if}
                
                <div class="info-section">
                    <h2>Basic Information</h2>
                    <div class="info-grid">
                        {#if candidate.name_first}
                            <div class="info-label">First Name:</div>
                            <div class="info-value">{candidate.name_first}</div>
                        {/if}
                        {#if candidate.name_middle}
                            <div class="info-label">Middle Name:</div>
                            <div class="info-value">{candidate.name_middle}</div>
                        {/if}
                        {#if candidate.name_last}
                            <div class="info-label">Last Name:</div>
                            <div class="info-value">{candidate.name_last}</div>
                        {/if}
                        {#if candidate.education}
                            <div class="info-label">Education:</div>
                            <div class="info-value">{candidate.education}</div>
                        {/if}
                        {#if candidate.date_of_birth}
                            <div class="info-label">Date of Birth:</div>
                            <div class="info-value">{candidate.date_of_birth}</div>
                        {/if}
                        {#if candidate.gender}
                            <div class="info-label">Gender:</div>
                            <div class="info-value">{candidate.gender}</div>
                        {/if}
                        {#if candidate.race}
                            <div class="info-label">Race:</div>
                            <div class="info-value">{candidate.race}</div>
                        {/if}
                        {#if candidate.ethnicity}
                            <div class="info-label">Ethnicity:</div>
                            <div class="info-value">{candidate.ethnicity}</div>
                        {/if}
                    </div>
                </div>
                
                {#if candidate.website_campaign || candidate.website_official || candidate.website_personal || candidate.email_campaign || candidate.email_official || candidate.phone_campaign}
                    <div class="info-section">
                        <h2>Contact Information</h2>
                        <div class="info-grid">
                            {#if candidate.email_campaign}
                                <div class="info-label">Campaign Email:</div>
                                <div class="info-value"><a href="mailto:{candidate.email_campaign}">{candidate.email_campaign}</a></div>
                            {/if}
                            {#if candidate.email_official}
                                <div class="info-label">Official Email:</div>
                                <div class="info-value"><a href="mailto:{candidate.email_official}">{candidate.email_official}</a></div>
                            {/if}
                            {#if candidate.phone_campaign}
                                <div class="info-label">Campaign Phone:</div>
                                <div class="info-value">{candidate.phone_campaign}</div>
                            {/if}
                            {#if candidate.address_campaign}
                                <div class="info-label">Campaign Address:</div>
                                <div class="info-value">{candidate.address_campaign}</div>
                            {/if}
                        </div>
                    </div>
                {/if}
                
                {#if candidate.website_campaign || candidate.website_official || candidate.website_personal || candidate.facebook_campaign || candidate.x_campaign || candidate.instagram_campaign}
                    <div class="info-section">
                        <h2>Online Presence</h2>
                        <div class="contact-links">
                            {#if candidate.website_campaign}
                                <a href={candidate.website_campaign} target="_blank" rel="noopener noreferrer">Campaign Website →</a>
                            {/if}
                            {#if candidate.website_official}
                                <a href={candidate.website_official} target="_blank" rel="noopener noreferrer">Official Website →</a>
                            {/if}
                            {#if candidate.website_personal}
                                <a href={candidate.website_personal} target="_blank" rel="noopener noreferrer">Personal Website →</a>
                            {/if}
                            {#if candidate.facebook_campaign}
                                <a href={candidate.facebook_campaign} target="_blank" rel="noopener noreferrer">Facebook →</a>
                            {/if}
                            {#if candidate.x_campaign}
                                <a href={candidate.x_campaign} target="_blank" rel="noopener noreferrer">X (Twitter) →</a>
                            {/if}
                            {#if candidate.instagram_campaign}
                                <a href={candidate.instagram_campaign} target="_blank" rel="noopener noreferrer">Instagram →</a>
                            {/if}
                        </div>
                    </div>
                {/if}
                {/if}
            </div>
        </main>
    </section>
</div>
