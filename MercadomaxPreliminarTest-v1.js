(() => {
  // ============================================================
  // MercadoMax - Espejo de preliminares para PRUEBAS
  // No modifica el checkout ni reemplaza el script original.
  // Solo copia los datos del formulario hacia el nuevo webhook n8n.
  // ============================================================

  const MM_TEST_WEBHOOK =
    "https://automatizacion-n8n.v4iimk.easypanel.host/webhook/funnelish-preliminar2";

  const MM_TEST_STORE = "Mercadomax";
  const MM_TEST_DEBOUNCE_MS = 4000;

  let mmTestTimer = null;
  let mmLastPayload = "";

  const valueByName = (name) =>
    document.querySelector(`[name="${name}"]`)?.value || "";

  function readIntegramelo() {
    const input = document.querySelector('[data-name="idIntegramelo"]');

    if (!input?.value) {
      return {
        idIntegramelo: null,
        urlOrigin: `${location.hostname}${location.pathname}`,
      };
    }

    try {
      const parsed = JSON.parse(input.value);
      return {
        idIntegramelo: parsed?.idIntegramelo || null,
        urlOrigin:
          parsed?.urlOrigin || `${location.hostname}${location.pathname}`,
      };
    } catch {
      return {
        idIntegramelo: input.value,
        urlOrigin: `${location.hostname}${location.pathname}`,
      };
    }
  }

  function readProducts() {
    return [...document.querySelectorAll(".os-name")]
      .map((el) => el.textContent?.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
  }

  function readTotalPrice() {
    const raw =
      document.querySelector(".os-total .os-price")?.textContent?.trim() || "";

    const digits = raw.replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  }

  function buildPayload() {
    const integ = readIntegramelo();

    return {
      storeName: MM_TEST_STORE,
      idIntegramelo: integ.idIntegramelo,
      urlOrigin: integ.urlOrigin,
      dateTime: new Date().toISOString(),
      leadType: "TEST_N8N",
      ipOrigin: "",
      notes: valueByName("notes"),
      client: {
        name: "",
        lastName: "",
        fullName: valueByName("full_name"),
        email: valueByName("email"),
        phone: valueByName("phone"),
      },
      dataAddress: {
        address: valueByName("shipping_address"),
        city: valueByName("shipping_city"),
        state: valueByName("shipping_state"),
        country: valueByName("shipping_country"),
        zipCode: valueByName("zip_code"),
        notes: valueByName("notes"),
        coordinates: {
          latitude: null,
          longitude: null,
        },
      },
      products: readProducts(),
      totalPrice: readTotalPrice(),
      testMode: true,
    };
  }

  async function sendTestLead() {
    try {
      const payload = buildPayload();

      // Evitamos enviar hasta que el script original haya creado el ID
      // y exista por lo menos un teléfono.
      if (!payload.idIntegramelo) return;
      if (!payload.client.phone || payload.client.phone === "+57") return;

      const comparable = JSON.stringify({
        ...payload,
        dateTime: undefined,
      });

      // Evita repetir exactamente el mismo payload.
      if (comparable === mmLastPayload) return;
      mmLastPayload = comparable;

      await fetch(MM_TEST_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-MercadoMax-Test": "1",
        },
        body: JSON.stringify(payload),
      });

      console.log("[MercadoMax TEST] preliminar enviado a n8n", payload);
    } catch (error) {
      console.error("[MercadoMax TEST] error enviando preliminar", error);
    }
  }

  function scheduleSend() {
    clearTimeout(mmTestTimer);
    mmTestTimer = setTimeout(sendTestLead, MM_TEST_DEBOUNCE_MS);
  }

  function initMercadoMaxTestMirror() {
    document.body.addEventListener("input", scheduleSend);
    document.body.addEventListener("change", scheduleSend);

    console.log(
      "[MercadoMax TEST] espejo de preliminares activo ->",
      MM_TEST_WEBHOOK
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMercadoMaxTestMirror);
  } else {
    initMercadoMaxTestMirror();
  }
})();
