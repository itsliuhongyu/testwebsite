<script>
  import { goto } from '$app/navigation';
  export let candidate = null;
  export let loading = true;
  export let error = null;
  export let raceId = null;
  export let base = '';
  export let showReturnToRace = true;
  export let returnToRace = () => {};
</script>

{#if showReturnToRace && raceId}
  <button class="back-button" on:click={returnToRace}>
    <img src="{base}/graphics/back.svg" alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" /> This Race
  </button>
{/if}
<button class="back-button" style="margin-left: 1rem;" on:click={() => goto(`${base}/`)}>
  <img src="{base}/graphics/back.svg" alt="" style="height: 1em; width: 1em; margin-right: 0.5rem; vertical-align: -0.125em; display: inline-block;" /> Home
</button>

{#if loading}
  <div class="loading-candidate-box" style="text-align: center; padding: 2rem;">
    <p>Loading candidate information...</p>
  </div>
{:else if error}
  <div class="loading-candidate-box" style="text-align: center; padding: 2rem; color: red;">
    <p>Error: {error}</p>
  </div>
{:else if candidate}
  <div class="candidate-header">
    <div class="candidate-photo">
      {#if candidate.candidate_id}
        <img src="{base}/graphics/candidates/{candidate.candidate_id}.jpg" alt={candidate.name} />
      {:else}
        <div class="placeholder-image">?</div>
      {/if}
    </div>
    
    <div class="candidate-basic-info">
      <h1>{candidate.name}</h1>
      {#if candidate.party}
        <p style="font-size: 1.2rem; margin: 0.5rem 0;">{candidate.party}</p>
      {/if}
      {#if candidate.occupation}
        <p style="font-size: 1.1rem; color: #555; margin: 0.5rem 0;">Occupation: {candidate.occupation}</p>
      {/if}
      <div class="contact-inline" style="margin-top:0.75rem;">
        {#if candidate.phone_number}
          <div class="contact-icons hover-tooltip" data-tooltip="Phone" style="font-size:0.95rem;margin-bottom:0.25rem">
            <img src={base + '/graphics/phone.svg'} alt="Phone Number" style="height:1.5em;vertical-align:middle;margin-right:0.5rem" loading="lazy" />
            {candidate.phone_number}
          </div>
        {/if}
        {#if candidate.municipality}
          <div style="font-size:0.95rem;color:#444;margin-bottom:0.25rem">Residence: {candidate.municipality}</div>
        {/if}

        <div class="contact-icons" style="margin-top:0.25rem">
          {#if candidate.email}
            <a class="hover-tooltip" data-tooltip="Email" href={"mailto:" + candidate.email} aria-label="Email">
              <img src={base + '/graphics/email.svg'} alt="Email" loading="lazy" />
            </a>
          {/if}
          {#if candidate.website}
            <a class="hover-tooltip" data-tooltip="Website" href={candidate.website} target="_blank" rel="noopener noreferrer" aria-label="Website">
              <img src={base + '/graphics/hyperlink.svg'} alt="Website" loading="lazy" />
            </a>
          {/if}
          {#if candidate.facebook}
            <a class="hover-tooltip" data-tooltip="Facebook" href={candidate.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <img src={base + '/graphics/logos/facebook.svg'} alt="Facebook" loading="lazy" />
            </a>
          {/if}

          {#if candidate.twitter}
            <a class="hover-tooltip" data-tooltip="Twitter" href={candidate.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <img src={base + '/graphics/logos/x.svg'} alt="Twitter" loading="lazy" />
            </a>
          {/if}
          {#if candidate.instagram}
            <a class="hover-tooltip" data-tooltip="Instagram" href={candidate.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <img src={base + '/graphics/logos/instagram.svg'} alt="Instagram" loading="lazy" />
            </a>
          {/if}
          {#if candidate.youtube}
            <a class="hover-tooltip" data-tooltip="YouTube" href={candidate.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <img src={base + '/graphics/logos/youtube.svg'} alt="YouTube" loading="lazy" />
            </a>
          {/if}


        </div>
      </div>
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
    <div class="candidate-basic-info">
      {#if candidate.basic_information}
        <div class="info-value">
          {candidate.basic_information}
        </div>
      {/if}
    </div>
  </div>



{/if}
