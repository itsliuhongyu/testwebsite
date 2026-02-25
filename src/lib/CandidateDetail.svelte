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
      {#if candidate.candidate_id}
        <img src="{base}/graphics/candidates/{candidate.candidate_id}.jpg" alt={candidate.name} />
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
  
  {#if candidate.email || candidate.phone_number || candidate.municipality}
    <div class="info-section">
      <h2>Contact Information</h2>
      <div class="info-grid">
        {#if candidate.email}
          <div class="info-label">Email:</div>
          <div class="info-value"><a href="mailto:{candidate.email}">{candidate.email}</a></div>
        {/if}
        {#if candidate.phone_number}
          <div class="info-label">Phone:</div>
          <div class="info-value">{candidate.phone_number}</div>
        {/if}
        {#if candidate.municipality}
          <div class="info-label">Location:</div>
          <div class="info-value">{candidate.municipality}</div>
        {/if}
      </div>
    </div>
  {/if}
  
  {#if candidate.website || candidate.facebook_campaign || candidate.x_campaign || candidate.instagram_campaign}
    <div class="info-section">
      <h2>Online Presence</h2>
      <div class="contact-links">
        {#if candidate.website}
          <a href={candidate.website} target="_blank" rel="noopener noreferrer">Website →</a>
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
