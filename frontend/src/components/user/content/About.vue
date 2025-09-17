<script setup>
</script>

<template>
  <section class="about">
    <!-- Hero -->
    <div class="hero">
      <div class="logo">
        <img src="../../../assets/domus.png" alt="DOMUS" />
      </div>
      <h1>DOMUS Architecture</h1>
      <p class="tagline">Design • Build • Creative — Architectural Services crafted for people and place.</p>
    </div>

    <!-- Core values -->
    <div class="cards">
      <article class="card">
        <span class="icon">
          <svg viewBox="0 0 24 24"><path d="M3 3h18v18H3z" fill="#e6b23a"/><path d="M7 7h10v2H7zM7 11h10v2H7zM7 15h6v2H7z" fill="#fff"/></svg>
        </span>
        <h3>Innovative Design</h3>
        <p>Thoughtful concepts that blend function, form, and the character of each site.</p>
      </article>

      <article class="card">
        <span class="icon">
          <svg viewBox="0 0 24 24"><path d="M12 2l9 5v10l-9 5-9-5V7z" fill="#e6b23a"/><path d="M12 12l9-5" stroke="#fff" stroke-width="2"/><path d="M12 12L3 7" stroke="#fff" stroke-width="2"/></svg>
        </span>
        <h3>Build With Clarity</h3>
        <p>Clear documentation and coordination that keep projects predictable and on track.</p>
      </article>

      <article class="card">
        <span class="icon">
          <svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 100 18 9 9 0 000-18z" fill="#8e24aa"/><path d="M12 6v6l4 2" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <h3>Creative Craft</h3>
        <p>Detail-focused environments that feel crafted, timeless, and uniquely yours.</p>
      </article>

      <article class="card">
        <span class="icon">
          <svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1016 0A8 8 0 004 12z" fill="#43a047"/><path d="M8 12l3 3 5-7" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <h3>Client-Centered</h3>
        <p>Collaboration from kickoff to handover—every decision guided by your goals.</p>
      </article>
    </div>

    <!-- Process -->
    <div class="process">
      <h2>Our Process</h2>
      <div class="steps">
        <div class="step">
          <span class="badge">1</span>
          <h4>Discover</h4>
          <p>Listen, learn, and align on vision, budget, and constraints.</p>
        </div>
        <div class="step">
          <span class="badge">2</span>
          <h4>Design</h4>
          <p>Iterate concepts into detailed plans with early cost awareness.</p>
        </div>
        <div class="step">
          <span class="badge">3</span>
          <h4>Develop</h4>
          <p>Coordinate with engineers, finalize drawings, and prepare permits.</p>
        </div>
        <div class="step">
          <span class="badge">4</span>
          <h4>Deliver</h4>
          <p>Support construction and ensure quality through completion.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px;
}
.hero {
  text-align: center;
  margin-bottom: 18px;
}
.logo img {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  box-shadow: 0 6px 20px #0002;
}
h1 { margin: 10px 0 6px; color: #213547; }
.tagline { color: #5a6675; }

.cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin: 16px 0 22px;
}
.card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  box-shadow: 0 2px 12px #00000010;
  padding: 16px;
}
.card .icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: grid; place-items: center;
  background: #f8f8f8;
  margin-bottom: 8px;
  box-shadow: inset 0 0 0 1px #eee;
}
.card .icon svg { width: 28px; height: 28px; }
.card h3 { margin: 6px 0 4px; color: #213547; }
.card p { margin: 0; color: #5a6675; }

.process h2 { color: #213547; text-align: center; margin: 6px 0 12px; }
.steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.step {
  background: linear-gradient(180deg, #ffffff, #fbfbfb);
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 14px;
}
.badge {
  width: 30px; height: 30px; border-radius: 50%;
  display: inline-grid; place-items: center;
  background: #e6b23a; color: #fff; font-weight: 800;
  box-shadow: 0 4px 14px #e6b23a55;
}
.step h4 { margin: 8px 0 4px; color: #213547; }
.step p { margin: 0; color: #5a6675; }

/* Responsive */
@media (max-width: 920px) {
  .cards { grid-template-columns: repeat(2, 1fr); }
  .steps { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .cards, .steps { grid-template-columns: 1fr; }
  .logo img { width: 60px; height: 60px; }
}
</style>