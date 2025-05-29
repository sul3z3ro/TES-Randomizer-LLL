// script9.js
fetch('thingamabob/province_mechanic.yaml')
  .then(res => res.text())
  .then(text => {
    const data = jsyaml.load(text);
    const marsh = data['Black Marsh'][0];

    function parseIcons(str) {
      return str
        .replace(/\[icon-lg:([a-zA-Z0-9_-]+)\]/g, '<img src="icon/$1.png" class="header-icon" alt="$1" />')
        .replace(/\[icon-md:([a-zA-Z0-9_-]+)\]/g, '<img src="icon/$1.png" class="md-icon" alt="$1" />')
        .replace(/\[icon:([a-zA-Z0-9_-]+)\]/g, '<img src="icon/$1.png" class="inline-icon" alt="$1" />')
        .replace(/\[hr\]/g, '<hr class="my-4 section-divider"/>')
        .replace(/\[b\](.*?)\[\/b\]/g, '<b>$1</b>')
        .replace(/\[i\](.*?)\[\/i\]/g, '<i>$1</i>');
    }

    // ใส่ Description (ถ้ามี [icon:xxx])
    document.getElementById('desc').innerHTML = parseIcons(marsh.Description);

    // ใส่ Mechanic (มี HTML + [icon:xxx])
    document.getElementById('mechanic').innerHTML = parseIcons(marsh.Mechanic.replace(/\n/g, "<br>"));

    // Native Skill
    document.getElementById('native').innerHTML = parseIcons(marsh.Native_skill.replace(/\n/g, "<br>"));

    // Delve Feat
    document.getElementById('delve').innerHTML = parseIcons(marsh.Delve_Feat.replace(/\n/g, "<br>"));

    document.getElementById("endCampaignBtn").addEventListener("click", () => {
    if (!confirm("คุณต้องการจบแคมเปญหรือไม่?")) return;
    sessionStorage.clear();
    location.reload();
  });
  });
