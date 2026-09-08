(() => {
  // ============================================================
  // MercadoMax - Espejo de preliminares para n8n
  // + Corrección Departamento / Ciudad
  // ============================================================

  const MM_TEST_WEBHOOK =
    "https://automatizacion-n8n.v4iimk.easypanel.host/webhook/funnelish-preliminar2";

  const MM_TEST_STORE = "Mercadomax";

  // Tiempo de espera antes de enviar actualización a n8n
  const MM_TEST_DEBOUNCE_MS = 4000;

  let mmTestTimer = null;
  let mmLastPayload = "";


  // ============================================================
  // UTILIDADES
  // ============================================================

  const valueByName = (name) =>
    document.querySelector(`[name="${name}"]`)?.value || "";


  function readIntegramelo() {

    const input =
      document.querySelector('[data-name="idIntegramelo"]');

    if (!input?.value) {

      return {
        idIntegramelo: null,
        urlOrigin:
          `${location.hostname}${location.pathname}`,
      };

    }


    try {

      const parsed =
        JSON.parse(input.value);

      return {

        idIntegramelo:
          parsed?.idIntegramelo || null,

        urlOrigin:
          parsed?.urlOrigin ||
          `${location.hostname}${location.pathname}`,

      };

    } catch {

      return {

        idIntegramelo:
          input.value,

        urlOrigin:
          `${location.hostname}${location.pathname}`,

      };

    }

  }


  function readProducts() {

    return [
      ...document.querySelectorAll(".os-name")
    ]
      .map(
        (el) =>
          el.textContent?.trim()
      )
      .filter(Boolean)
      .map(
        (name) => ({
          name
        })
      );

  }


  function readTotalPrice() {

    const raw =
      document
        .querySelector(
          ".os-total .os-price"
        )
        ?.textContent
        ?.trim() || "";

    const digits =
      raw.replace(/[^\d]/g, "");

    return digits
      ? Number(digits)
      : 0;

  }


  // ============================================================
  // CREAR PAYLOAD PRELIMINAR
  // ============================================================

  function buildPayload() {

    const integ =
      readIntegramelo();

    return {

      storeName:
        MM_TEST_STORE,

      idIntegramelo:
        integ.idIntegramelo,

      urlOrigin:
        integ.urlOrigin,

      dateTime:
        new Date().toISOString(),

      leadType:
        "TEST_N8N",

      ipOrigin: "",

      notes:
        valueByName("notes"),

      client: {

        name: "",

        lastName: "",

        fullName:
          valueByName("full_name"),

        email:
          valueByName("email"),

        phone:
          valueByName("phone"),

      },

      dataAddress: {

        address:
          valueByName(
            "shipping_address"
          ),

        city:
          valueByName(
            "shipping_city"
          ),

        state:
          valueByName(
            "shipping_state"
          ),

        country:
          valueByName(
            "shipping_country"
          ),

        zipCode:
          valueByName(
            "zip_code"
          ),

        notes:
          valueByName(
            "notes"
          ),

        coordinates: {

          latitude: null,

          longitude: null,

        },

      },

      products:
        readProducts(),

      totalPrice:
        readTotalPrice(),

      testMode: true,

    };

  }


  // ============================================================
  // ENVIAR PRELIMINAR
  // ============================================================

  async function sendTestLead() {

    try {

      const payload =
        buildPayload();


      // Esperamos a que el script original
      // haya generado idIntegramelo
      if (
        !payload.idIntegramelo
      ) {
        return;
      }


      // No enviamos si todavía
      // no existe teléfono
      if (
        !payload.client.phone ||
        payload.client.phone === "+57"
      ) {
        return;
      }


      const comparable =
        JSON.stringify({

          ...payload,

          dateTime:
            undefined,

        });


      // Evitamos enviar dos veces
      // exactamente los mismos datos
      if (
        comparable ===
        mmLastPayload
      ) {
        return;
      }


      mmLastPayload =
        comparable;


      await fetch(
        MM_TEST_WEBHOOK,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json",

            "X-MercadoMax-Test":
              "1",

          },

          body:
            JSON.stringify(
              payload
            ),

        }
      );


      console.log(
        "[MercadoMax TEST] preliminar enviado a n8n",
        payload
      );


    } catch (error) {

      console.error(
        "[MercadoMax TEST] error enviando preliminar",
        error
      );

    }

  }


  function scheduleSend() {

    clearTimeout(
      mmTestTimer
    );

    mmTestTimer =
      setTimeout(
        sendTestLead,
        MM_TEST_DEBOUNCE_MS
      );

  }


  // ============================================================
  // CORREGIR DEPARTAMENTO Y CIUDAD
  // ============================================================

  function corregirDepartamentoCiudad() {

    const stateSel =
      document.getElementsByName(
        "shipping_state"
      )[0];

    const citySel =
      document.getElementsByName(
        "shipping_city"
      )[0];


    if (
      !stateSel ||
      !citySel
    ) {

      console.warn(
        "[MercadoMax] No se encontraron Departamento o Ciudad"
      );

      return;

    }


    // ----------------------------------------------------------
    // DEPARTAMENTO
    // ----------------------------------------------------------

    const opcionesDepartamento =
      Array.from(
        stateSel.options
      );


    let placeholderDepartamento =
      opcionesDepartamento.find(
        option =>
          option.text
            .trim()
            .toLowerCase() ===
          "seleccione un departamento"
      );


    // Si existe el placeholder creado
    // por el código viejo, lo corregimos
    if (
      placeholderDepartamento
    ) {

      placeholderDepartamento.value =
        "";

      placeholderDepartamento.disabled =
        true;

      placeholderDepartamento.selected =
        true;

    } else {

      // Si no existe, lo creamos

      placeholderDepartamento =
        new Option(
          "Seleccione un Departamento",
          ""
        );

      placeholderDepartamento.disabled =
        true;

      placeholderDepartamento.selected =
        true;


      stateSel.insertBefore(
        placeholderDepartamento,
        stateSel.firstChild
      );

    }


    stateSel.value = "";

    stateSel.required = true;


    // ----------------------------------------------------------
    // CIUDAD INICIAL
    // ----------------------------------------------------------

    citySel.innerHTML =
      "";


    const placeholderCiudad =
      new Option(
        "Seleccione una Ciudad",
        ""
      );


    placeholderCiudad.disabled =
      true;

    placeholderCiudad.selected =
      true;


    citySel.options.add(
      placeholderCiudad
    );


    citySel.required =
      true;


    // ----------------------------------------------------------
    // GUARDAMOS EL ONCHANGE ORIGINAL
    // ----------------------------------------------------------

    const onchangeOriginal =
      stateSel.onchange;


    // ----------------------------------------------------------
    // CUANDO CAMBIA EL DEPARTAMENTO
    // ----------------------------------------------------------

    stateSel.onchange =
      function (event) {


        // Primero ejecutamos la función
        // original de MercadoMax.
        // Ella carga las ciudades.
        if (
          typeof onchangeOriginal ===
          "function"
        ) {

          onchangeOriginal.call(
            this,
            event
          );

        }


        // Después corregimos el
        // placeholder de ciudad.
        const opcionesCiudad =
          Array.from(
            citySel.options
          );


        let ciudadDefault =
          opcionesCiudad.find(
            option =>
              option.value === ""
          );


        if (
          !ciudadDefault
        ) {

          ciudadDefault =
            new Option(
              "Seleccione una Ciudad",
              ""
            );


          citySel.insertBefore(
            ciudadDefault,
            citySel.firstChild
          );

        }


        ciudadDefault.text =
          "Seleccione una Ciudad";

        ciudadDefault.value =
          "";

        ciudadDefault.disabled =
          true;

        ciudadDefault.selected =
          true;


        citySel.value =
          "";


        // También programamos actualización
        // del preliminar al cambiar departamento.
        scheduleSend();

      };


    console.log(
      "[MercadoMax] Departamento y Ciudad corregidos"
    );

  }


  // ============================================================
  // VALIDAR ANTES DE CONTINUAR CHECKOUT
  // ============================================================

  function activarValidacionUbicacion() {

    document.addEventListener(
      "click",
      function (event) {

        const boton =
          event.target.closest(
            'a[href="#submit-step"]'
          );


        if (!boton) {
          return;
        }


        const stateSel =
          document.getElementsByName(
            "shipping_state"
          )[0];

        const citySel =
          document.getElementsByName(
            "shipping_city"
          )[0];


        if (!stateSel || !citySel) {
          return;
        }


        // Departamento vacío
        if (!stateSel.value) {

          event.preventDefault();

          event.stopImmediatePropagation();

          stateSel.focus();

          alert(
            "Por favor selecciona tu departamento."
          );

          return;

        }


        // Ciudad vacía
        if (!citySel.value) {

          event.preventDefault();

          event.stopImmediatePropagation();

          citySel.focus();

          alert(
            "Por favor selecciona tu ciudad."
          );

          return;

        }

      },

      true
    );

  }


  // ============================================================
  // INICIAR ESPEJO N8N
  // ============================================================

  function initMercadoMaxTestMirror() {

    document.body.addEventListener(
      "input",
      scheduleSend
    );

    document.body.addEventListener(
      "change",
      scheduleSend
    );


    activarValidacionUbicacion();


    console.log(
      "[MercadoMax TEST] espejo de preliminares activo ->",
      MM_TEST_WEBHOOK
    );

  }


  // ============================================================
  // INICIALIZACIÓN
  // ============================================================

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initMercadoMaxTestMirror
    );

  } else {

    initMercadoMaxTestMirror();

  }


  // IMPORTANTE:
  // esperamos al evento load porque el script viejo de Vercel
  // crea Departamento y Ciudad en ese momento.
  window.addEventListener(
    "load",
    () => {

      // Pequeño margen para permitir que
      // termine la lógica antigua.
      setTimeout(
        corregirDepartamentoCiudad,
        300
      );

    }
  );

})();
