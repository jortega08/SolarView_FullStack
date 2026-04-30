from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from alerta.models import Alerta, TipoAlerta
from auditoria.models import EventoAuditoria
from core.models import (
    Ciudad,
    ConfiguracionUser,
    Domicilio,
    Empresa,
    Estado,
    Instalacion,
    Pais,
    RolInstalacion,
    Sensor,
    Usuario,
)
from core.utils import system_user
from mantenimiento.models import ContratoServicio, Mantenimiento, PlanMantenimiento
from notificaciones.models import Notificacion, PlantillaNotificacion
from ordenes.models import ComentarioOrden, EvidenciaOrden, OrdenTrabajo
from tecnicos.models import Especialidad, PerfilTecnico

PASSWORD = "DemoSoleim2026!"


class Command(BaseCommand):
    help = "Carga datos demo no telemetricos para ver el sistema interactuando."

    def handle(self, *args, **options):
        with transaction.atomic():
            summary = seed_demo_data()

        self.stdout.write(self.style.SUCCESS("Datos demo no telemetricos cargados."))
        for label, value in summary.items():
            self.stdout.write(f"{label}: {value}")


def seed_demo_data():
    today = timezone.localdate()
    now = timezone.now()

    pais = _get_or_update(Pais, {"nombre": "Colombia"}, nombre="Colombia")

    departamentos = {
        "Cundinamarca": ["Bogota", "Chia", "Funza"],
        "Antioquia": ["Medellin", "Rionegro"],
        "Valle del Cauca": ["Cali", "Palmira"],
        "Atlantico": ["Barranquilla"],
        "Santander": ["Bucaramanga"],
        "Bolivar": ["Cartagena"],
    }
    ciudades = {}
    for estado_nombre, ciudad_nombres in departamentos.items():
        estado = _get_or_update(
            Estado,
            {"nombre": estado_nombre, "pais": pais},
            nombre=estado_nombre,
            pais=pais,
        )
        for ciudad_nombre in ciudad_nombres:
            ciudades[ciudad_nombre] = _get_or_update(
                Ciudad,
                {"nombre": ciudad_nombre, "estado": estado},
                nombre=ciudad_nombre,
                estado=estado,
            )

    usuarios = _seed_users(ciudades)
    domicilios = _seed_domicilios(usuarios, ciudades)
    empresas = _seed_empresas(ciudades)
    instalaciones = _seed_instalaciones(empresas, ciudades, today)
    _seed_sensores(instalaciones, now)
    _seed_roles(usuarios, instalaciones)
    especialidades = _seed_especialidades()
    tecnicos = _seed_tecnicos(usuarios, empresas, ciudades, especialidades, today)
    planes = _seed_planes(especialidades)
    _seed_contratos(instalaciones, today)
    tipos_alerta = _seed_tipos_alerta()
    alertas = _seed_alertas(instalaciones, tipos_alerta, usuarios, today, now)
    mantenimientos = _seed_mantenimientos(instalaciones, planes, today)
    ordenes = _seed_ordenes(
        instalaciones,
        mantenimientos,
        alertas,
        usuarios,
        tecnicos,
        today,
        now,
    )
    _seed_configuraciones(domicilios, instalaciones, alertas)
    _seed_comentarios_y_evidencias(ordenes, usuarios)
    _seed_plantillas_y_notificaciones(usuarios, ordenes, instalaciones, now)
    _seed_auditoria(usuarios, empresas, instalaciones, ordenes)

    return {
        "paises": Pais.objects.count(),
        "estados": Estado.objects.count(),
        "ciudades": Ciudad.objects.count(),
        "usuarios": Usuario.objects.count(),
        "domicilios": Domicilio.objects.count(),
        "empresas": Empresa.objects.count(),
        "instalaciones": Instalacion.objects.count(),
        "sensores": Sensor.objects.count(),
        "roles_instalacion": RolInstalacion.objects.count(),
        "especialidades": Especialidad.objects.count(),
        "tecnicos": PerfilTecnico.objects.count(),
        "contratos": ContratoServicio.objects.count(),
        "planes_mantenimiento": PlanMantenimiento.objects.count(),
        "mantenimientos": Mantenimiento.objects.count(),
        "ordenes": OrdenTrabajo.objects.count(),
        "comentarios_orden": ComentarioOrden.objects.count(),
        "evidencias_orden": EvidenciaOrden.objects.count(),
        "tipos_alerta": TipoAlerta.objects.count(),
        "alertas": Alerta.objects.count(),
        "plantillas_notificacion": PlantillaNotificacion.objects.count(),
        "notificaciones": Notificacion.objects.count(),
        "eventos_auditoria": EventoAuditoria.objects.count(),
    }


def _get_or_update(model, lookup, **values):
    obj, _ = model.objects.get_or_create(**lookup, defaults=values)
    dirty = False
    for field, value in values.items():
        if getattr(obj, field) != value:
            setattr(obj, field, value)
            dirty = True
    if dirty:
        obj.save()
    return obj


def _seed_users(ciudades):
    specs = [
        ("admin.demo@soleim.local", "Laura Mendoza", "admin"),
        ("operaciones@soleim.local", "Carlos Rueda", "user"),
        ("energia@soleim.local", "Diana Torres", "user"),
        ("finanzas@soleim.local", "Mateo Alvarez", "user"),
        ("cliente.andina@soleim.local", "Sofia Vargas", "user"),
        ("cliente.clinica@soleim.local", "Andres Cardenas", "user"),
        ("cliente.campus@soleim.local", "Valentina Perez", "user"),
        ("cliente.frioexpress@soleim.local", "Nicolas Prieto", "user"),
        ("tecnico.maria@soleim.local", "Maria Fernanda Gomez", "user"),
        ("tecnico.jorge@soleim.local", "Jorge Ramirez", "user"),
        ("tecnico.paula@soleim.local", "Paula Castillo", "user"),
        ("tecnico.esteban@soleim.local", "Esteban Munoz", "user"),
        ("tecnico.lina@soleim.local", "Lina Ortega", "user"),
        ("tecnico.oscar@soleim.local", "Oscar Herrera", "user"),
    ]
    users = {"system": system_user()}
    for email, nombre, rol in specs:
        user = Usuario.objects.filter(email=email).first()
        if not user:
            user = Usuario(nombre=nombre, email=email, rol=rol, is_active=True)
            user.set_password(PASSWORD)
            user.save()
        else:
            changed = False
            for field, value in {
                "nombre": nombre,
                "rol": rol,
                "is_active": True,
            }.items():
                if getattr(user, field) != value:
                    setattr(user, field, value)
                    changed = True
            if changed:
                user.save()
        users[email] = user

    # Dar contexto minimo al usuario demo existente.
    for email in ("juan@example.com", "camilo@soleim.com"):
        existing = Usuario.objects.filter(email=email).first()
        if existing:
            users[email] = existing
    return users


def _seed_domicilios(usuarios, ciudades):
    assignments = {
        "admin.demo@soleim.local": "Bogota",
        "operaciones@soleim.local": "Bogota",
        "energia@soleim.local": "Medellin",
        "finanzas@soleim.local": "Cali",
        "cliente.andina@soleim.local": "Palmira",
        "cliente.clinica@soleim.local": "Medellin",
        "cliente.campus@soleim.local": "Bogota",
        "cliente.frioexpress@soleim.local": "Barranquilla",
        "tecnico.maria@soleim.local": "Bogota",
        "tecnico.jorge@soleim.local": "Medellin",
        "tecnico.paula@soleim.local": "Cali",
        "tecnico.esteban@soleim.local": "Barranquilla",
        "tecnico.lina@soleim.local": "Bucaramanga",
        "tecnico.oscar@soleim.local": "Cartagena",
    }
    domicilios = {}
    for email, ciudad_nombre in assignments.items():
        usuario = usuarios[email]
        domicilios[email] = _get_or_update(
            Domicilio,
            {"usuario": usuario, "ciudad": ciudades[ciudad_nombre]},
            usuario=usuario,
            ciudad=ciudades[ciudad_nombre],
        )
    return domicilios


def _seed_empresas(ciudades):
    specs = [
        ("900000001", "Soleim Demo", "Energia solar", "Bogota"),
        ("901245781", "Andina Foods", "Alimentos", "Palmira"),
        ("900874221", "Clinica San Marcos", "Salud", "Medellin"),
        ("901778340", "Campus Norte", "Educacion", "Bogota"),
        ("901554892", "FrioExpress Colombia", "Logistica refrigerada", "Barranquilla"),
    ]
    empresas = {}
    for nit, nombre, sector, ciudad_nombre in specs:
        empresas[nombre] = _get_or_update(
            Empresa,
            {"nit": nit},
            nombre=nombre,
            nit=nit,
            sector=sector,
            ciudad=ciudades[ciudad_nombre],
        )
    return empresas


def _seed_instalaciones(empresas, ciudades, today):
    specs = [
        (
            "Soleim Demo",
            "Instalacion Demo",
            "Calle 80 # 12-40",
            "Bogota",
            "hibrido",
            5.0,
            10.0,
            "activa",
            190,
        ),
        (
            "Soleim Demo",
            "Laboratorio I+D Bogota",
            "Zona Franca Fontibon Bodega 14",
            "Bogota",
            "grid_tie",
            22.5,
            0.0,
            "activa",
            132,
        ),
        (
            "Andina Foods",
            "Planta Palmira Cubierta 1",
            "Km 4 Via Palmira - Cali",
            "Palmira",
            "hibrido",
            145.0,
            320.0,
            "activa",
            420,
        ),
        (
            "Andina Foods",
            "Centro Distribucion Cali",
            "Carrera 8 # 39-22",
            "Cali",
            "grid_tie",
            86.0,
            60.0,
            "mantenimiento",
            310,
        ),
        (
            "Clinica San Marcos",
            "Clinica Torre A",
            "Avenida El Poblado # 43A-21",
            "Medellin",
            "hibrido",
            98.0,
            240.0,
            "activa",
            365,
        ),
        (
            "Clinica San Marcos",
            "Sede Rionegro Urgencias",
            "Calle 51 # 47-12",
            "Rionegro",
            "off_grid",
            42.0,
            180.0,
            "activa",
            210,
        ),
        (
            "Campus Norte",
            "Biblioteca Central",
            "Carrera 7 # 173-03",
            "Bogota",
            "grid_tie",
            64.5,
            48.0,
            "activa",
            260,
        ),
        (
            "Campus Norte",
            "Laboratorios Ingenieria",
            "Autopista Norte # 182-45",
            "Chia",
            "hibrido",
            78.0,
            120.0,
            "activa",
            170,
        ),
        (
            "FrioExpress Colombia",
            "Bodega Refrigerada Barranquilla",
            "Via 40 # 75-160",
            "Barranquilla",
            "hibrido",
            118.0,
            360.0,
            "mantenimiento",
            280,
        ),
        (
            "FrioExpress Colombia",
            "Hub Cartagena",
            "Mamonal Km 8",
            "Cartagena",
            "off_grid",
            56.0,
            210.0,
            "activa",
            140,
        ),
    ]
    instalaciones = {}
    for (
        empresa_nombre,
        nombre,
        direccion,
        ciudad_nombre,
        tipo,
        panel_kw,
        bateria_kwh,
        estado,
        age_days,
    ) in specs:
        empresa = empresas[empresa_nombre]
        instalacion = Instalacion.objects.filter(
            empresa=empresa,
            nombre=nombre,
        ).first()
        values = {
            "empresa": empresa,
            "nombre": nombre,
            "direccion": direccion,
            "ciudad": ciudades[ciudad_nombre],
            "tipo_sistema": tipo,
            "capacidad_panel_kw": panel_kw,
            "capacidad_bateria_kwh": bateria_kwh,
            "fecha_instalacion": today - timedelta(days=age_days),
            "estado": estado,
            "ultimo_mantenimiento": today - timedelta(days=35 + (age_days % 20)),
            "proximo_mantenimiento": today + timedelta(days=7 + (age_days % 16)),
            "garantia_hasta": today + timedelta(days=730 - (age_days % 120)),
        }
        if not instalacion:
            instalacion = Instalacion.objects.create(**values)
        else:
            for field, value in values.items():
                setattr(instalacion, field, value)
            instalacion.save()
        instalaciones[nombre] = instalacion
    return instalaciones


def _seed_sensores(instalaciones, now):
    sensores = {}
    for index, (instalacion_nombre, instalacion) in enumerate(
        instalaciones.items(), start=1
    ):
        prefix = _sensor_code_prefix(instalacion_nombre, index)
        estado_base = (
            "mantenimiento" if instalacion.estado == "mantenimiento" else "activo"
        )
        specs = [
            (
                f"Gateway {instalacion.nombre}",
                f"{prefix}-GW",
                "gateway",
                "",
                estado_base,
                None,
                "Gateway de comunicaciones del sitio.",
            ),
            (
                f"Inversor principal {instalacion.nombre}",
                f"{prefix}-INV",
                "inversor",
                "kW",
                estado_base,
                round(instalacion.capacidad_panel_kw * 0.72, 2),
                "Lectura operacional visible para inventario.",
            ),
            (
                f"Medidor bidireccional {instalacion.nombre}",
                f"{prefix}-MED",
                "medidor",
                "kWh",
                "activo",
                round(instalacion.capacidad_panel_kw * 4.1, 2),
                "Medidor de energia para cruces con facturacion.",
            ),
            (
                f"Piranometro {instalacion.nombre}",
                f"{prefix}-IRR",
                "irradiancia",
                "W/m2",
                "activo",
                720 + (index * 11),
                "Referencia ambiental del arreglo solar.",
            ),
            (
                f"Temperatura cuarto tecnico {instalacion.nombre}",
                f"{prefix}-TMP",
                "temperatura",
                "C",
                "activo",
                24 + (index % 5),
                "Temperatura de gabinete o cuarto electrico.",
            ),
        ]
        if instalacion.capacidad_bateria_kwh > 0:
            specs.append(
                (
                    f"BMS banco baterias {instalacion.nombre}",
                    f"{prefix}-BMS",
                    "bateria",
                    "%",
                    estado_base,
                    68 + (index % 24),
                    "Estado operativo del banco de baterias.",
                )
            )

        for nombre, codigo, tipo, unidad, estado, lectura, notas in specs:
            sensores[codigo] = _get_or_update(
                Sensor,
                {"codigo": codigo},
                instalacion=instalacion,
                nombre=nombre[:120],
                codigo=codigo,
                tipo=tipo,
                unidad=unidad,
                estado=estado,
                ultima_lectura=lectura,
                fecha_ultima_lectura=now - timedelta(minutes=index * 7),
                notas=notas,
            )

    spare_specs = [
        ("Sensor repuesto gateway", "SPARE-GW-01", "gateway", "", "inactivo"),
        ("Pinza medidora repuesto", "SPARE-MED-01", "medidor", "A", "inactivo"),
        ("Sensor temperatura movil", "SPARE-TMP-01", "temperatura", "C", "inactivo"),
    ]
    for nombre, codigo, tipo, unidad, estado in spare_specs:
        sensores[codigo] = _get_or_update(
            Sensor,
            {"codigo": codigo},
            instalacion=None,
            nombre=nombre,
            codigo=codigo,
            tipo=tipo,
            unidad=unidad,
            estado=estado,
            ultima_lectura=None,
            fecha_ultima_lectura=None,
            notas="Sensor disponible para asignar desde el CRUD.",
        )
    return sensores


def _sensor_code_prefix(name, index):
    slug = "".join(ch for ch in name.upper() if ch.isalnum())
    return f"{slug[:8]}-{index:02d}"


def _seed_roles(usuarios, instalaciones):
    role_specs = [
        ("admin.demo@soleim.local", "admin_empresa", list(instalaciones)),
        (
            "operaciones@soleim.local",
            "operador",
            [
                "Instalacion Demo",
                "Laboratorio I+D Bogota",
                "Biblioteca Central",
                "Laboratorios Ingenieria",
            ],
        ),
        (
            "energia@soleim.local",
            "operador",
            ["Clinica Torre A", "Sede Rionegro Urgencias"],
        ),
        (
            "finanzas@soleim.local",
            "viewer",
            [
                "Planta Palmira Cubierta 1",
                "Centro Distribucion Cali",
                "Bodega Refrigerada Barranquilla",
            ],
        ),
        (
            "cliente.andina@soleim.local",
            "admin_empresa",
            ["Planta Palmira Cubierta 1", "Centro Distribucion Cali"],
        ),
        (
            "cliente.clinica@soleim.local",
            "admin_empresa",
            ["Clinica Torre A", "Sede Rionegro Urgencias"],
        ),
        (
            "cliente.campus@soleim.local",
            "admin_empresa",
            ["Biblioteca Central", "Laboratorios Ingenieria"],
        ),
        (
            "cliente.frioexpress@soleim.local",
            "admin_empresa",
            ["Bodega Refrigerada Barranquilla", "Hub Cartagena"],
        ),
    ]
    for email, rol, installation_names in role_specs:
        for name in installation_names:
            _get_or_update(
                RolInstalacion,
                {"usuario": usuarios[email], "instalacion": instalaciones[name]},
                usuario=usuarios[email],
                instalacion=instalaciones[name],
                rol=rol,
            )

    for email, name in [
        ("juan@example.com", "Instalacion Demo"),
        ("camilo@soleim.com", "Instalacion Demo"),
    ]:
        if email in usuarios:
            _get_or_update(
                RolInstalacion,
                {"usuario": usuarios[email], "instalacion": instalaciones[name]},
                usuario=usuarios[email],
                instalacion=instalaciones[name],
                rol="admin_empresa" if email == "camilo@soleim.com" else "viewer",
            )


def _seed_especialidades():
    specs = [
        ("Solar fotovoltaica", "Diagnostico y mantenimiento de arreglos solares."),
        ("Baterias de litio", "Bancos de baterias, BMS y autonomia."),
        ("Inversores", "Inversores hibridos, grid tie y protecciones."),
        ("Redes electricas", "Tableros, acometidas y calidad de energia."),
        ("Seguridad industrial", "Trabajo seguro en alturas y protocolos SST."),
        ("Monitoreo IoT", "Gateways, sensores y comunicaciones de campo."),
    ]
    return {
        nombre: _get_or_update(
            Especialidad,
            {"nombre": nombre},
            nombre=nombre,
            descripcion=descripcion,
        )
        for nombre, descripcion in specs
    }


def _seed_tecnicos(usuarios, empresas, ciudades, especialidades, today):
    specs = [
        (
            "tecnico.maria@soleim.local",
            "Soleim Demo",
            "CC-1002457810",
            "+57 310 456 7788",
            ["Solar fotovoltaica", "Inversores", "Seguridad industrial"],
            ["Bogota", "Chia", "Funza"],
            True,
            420,
        ),
        (
            "tecnico.jorge@soleim.local",
            "Clinica San Marcos",
            "CC-1003982241",
            "+57 311 220 4560",
            ["Baterias de litio", "Inversores"],
            ["Medellin", "Rionegro"],
            True,
            390,
        ),
        (
            "tecnico.paula@soleim.local",
            "Andina Foods",
            "CC-1010045582",
            "+57 315 882 0199",
            ["Solar fotovoltaica", "Redes electricas"],
            ["Cali", "Palmira"],
            True,
            510,
        ),
        (
            "tecnico.esteban@soleim.local",
            "FrioExpress Colombia",
            "CC-80122344",
            "+57 300 987 4412",
            ["Baterias de litio", "Redes electricas", "Monitoreo IoT"],
            ["Barranquilla", "Cartagena"],
            False,
            45,
        ),
        (
            "tecnico.lina@soleim.local",
            "Campus Norte",
            "CC-52887890",
            "+57 320 775 9011",
            ["Monitoreo IoT", "Inversores"],
            ["Bogota", "Chia", "Bucaramanga"],
            True,
            620,
        ),
        (
            "tecnico.oscar@soleim.local",
            "Soleim Demo",
            "CC-79300412",
            "+57 301 333 8810",
            ["Seguridad industrial", "Redes electricas"],
            ["Bogota", "Cartagena", "Barranquilla"],
            True,
            700,
        ),
    ]
    perfiles = {}
    for (
        email,
        empresa_nombre,
        cedula,
        telefono,
        especialidad_nombres,
        zona_nombres,
        disponible,
        licencia_days,
    ) in specs:
        perfil = PerfilTecnico.objects.filter(usuario=usuarios[email]).first()
        values = {
            "usuario": usuarios[email],
            "empresa": empresas[empresa_nombre],
            "cedula": cedula,
            "telefono": telefono,
            "disponible": disponible,
            "licencia_vence": today + timedelta(days=licencia_days),
            "notas": "Tecnico demo con disponibilidad operativa para despacho.",
            "area_profesional": especialidad_nombres[0],
            "resumen_profesional": (
                f"{usuarios[email].nombre} atiende instalaciones solares en "
                f"{', '.join(zona_nombres[:2])} con foco en "
                f"{', '.join(especialidad_nombres[:2])}."
            ),
            "estudios": [
                f"Certificacion SOLEIM en {especialidad_nombres[0]}",
                "Curso de trabajo seguro en alturas",
                "Diplomado en operacion y mantenimiento solar",
            ],
        }
        if not perfil:
            perfil = PerfilTecnico.objects.create(**values)
        else:
            for field, value in values.items():
                setattr(perfil, field, value)
            perfil.save()
        perfil.especialidades.set(
            [especialidades[nombre] for nombre in especialidad_nombres]
        )
        perfil.zonas.set([ciudades[nombre] for nombre in zona_nombres])
        perfiles[email] = perfil
    return perfiles


def _seed_planes(especialidades):
    specs = [
        (
            "Preventivo hibrido trimestral",
            "hibrido",
            90,
            Decimal("4.0"),
            "Baterias de litio",
            [
                {"titulo": "Inspeccionar strings fotovoltaicos", "requerido": True},
                {"titulo": "Validar BMS y ciclos de carga", "requerido": True},
                {"titulo": "Limpiar tableros y verificar torque", "requerido": True},
                {"titulo": "Probar transferencia red/bateria", "requerido": True},
            ],
        ),
        (
            "Preventivo grid tie bimestral",
            "grid_tie",
            60,
            Decimal("2.5"),
            "Inversores",
            [
                {"titulo": "Revisar inversores y protecciones AC", "requerido": True},
                {"titulo": "Limpiar paneles en cubierta", "requerido": True},
                {"titulo": "Descargar eventos del datalogger", "requerido": False},
            ],
        ),
        (
            "Preventivo off grid mensual",
            "off_grid",
            30,
            Decimal("3.5"),
            "Baterias de litio",
            [
                {"titulo": "Medir autonomia disponible", "requerido": True},
                {"titulo": "Probar respaldo nocturno", "requerido": True},
                {"titulo": "Verificar estado de cableado DC", "requerido": True},
            ],
        ),
    ]
    planes = {}
    for nombre, tipo, frecuencia, duracion, especialidad, checklist in specs:
        planes[tipo] = _get_or_update(
            PlanMantenimiento,
            {"nombre": nombre},
            nombre=nombre,
            tipo_sistema=tipo,
            frecuencia_dias=frecuencia,
            duracion_estimada_horas=duracion,
            especialidad_requerida=especialidades[especialidad],
            checklist=checklist,
            activo=True,
        )
    return planes


def _seed_contratos(instalaciones, today):
    specs = {
        "Instalacion Demo": ("estandar", 24, 60),
        "Laboratorio I+D Bogota": ("basico", 48, 90),
        "Planta Palmira Cubierta 1": ("premium", 8, 45),
        "Centro Distribucion Cali": ("estandar", 16, 60),
        "Clinica Torre A": ("premium", 4, 30),
        "Sede Rionegro Urgencias": ("premium", 6, 30),
        "Biblioteca Central": ("estandar", 24, 60),
        "Laboratorios Ingenieria": ("estandar", 24, 60),
        "Bodega Refrigerada Barranquilla": ("premium", 6, 30),
        "Hub Cartagena": ("estandar", 18, 45),
    }
    contratos = {}
    for nombre, (nivel, horas, frecuencia) in specs.items():
        contratos[nombre] = _get_or_update(
            ContratoServicio,
            {"instalacion": instalaciones[nombre]},
            instalacion=instalaciones[nombre],
            nivel=nivel,
            horas_respuesta=horas,
            frecuencia_preventivo_dias=frecuencia,
            fecha_inicio=today - timedelta(days=210),
            fecha_fin=today + timedelta(days=365),
            activo=True,
        )
    return contratos


def _seed_tipos_alerta():
    specs = [
        ("bateria_baja", "Nivel de bateria bajo o autonomia reducida."),
        ("temperatura_bateria", "Temperatura de bateria fuera de rango."),
        ("inversor_offline", "Inversor sin comunicacion o en falla."),
        ("produccion_baja", "Produccion solar por debajo del esperado."),
        ("mantenimiento_vencido", "Mantenimiento preventivo fuera de fecha."),
        ("comunicacion_iot", "Gateway o sensor sin reporte reciente."),
    ]
    tipos = {}
    for nombre, descripcion in specs:
        tipos[nombre] = _get_or_update(
            TipoAlerta,
            {"nombre": nombre},
            nombre=nombre,
            descripcion=descripcion,
        )
    return tipos


def _seed_alertas(instalaciones, tipos_alerta, usuarios, today, now):
    specs = [
        (
            "Clinica Torre A",
            "inversor_offline",
            "Inversor 2 reporta reconexion intermitente.",
            "activa",
            "critica",
            "Microcortes en tablero AC.",
            "Enviar tecnico de inversores y revisar protecciones.",
            2,
        ),
        (
            "Bodega Refrigerada Barranquilla",
            "bateria_baja",
            "Banco B registra autonomia menor a 45 minutos.",
            "activa",
            "alta",
            "Carga nocturna mayor a la prevista.",
            "Priorizar revision de BMS y cargas criticas.",
            1,
        ),
        (
            "Centro Distribucion Cali",
            "mantenimiento_vencido",
            "Mantenimiento preventivo vencido hace 5 dias.",
            "activa",
            "media",
            "Visita aplazada por acceso a cubierta.",
            "Reprogramar visita y confirmar permiso de alturas.",
            5,
        ),
        (
            "Laboratorios Ingenieria",
            "comunicacion_iot",
            "Gateway IoT sin reporte estable desde la madrugada.",
            "activa",
            "media",
            "Senal LTE degradada.",
            "Cambiar SIM de respaldo y validar antena.",
            0,
        ),
        (
            "Planta Palmira Cubierta 1",
            "produccion_baja",
            "Produccion 18 por ciento inferior al promedio semanal.",
            "resuelta",
            "alta",
            "Suciedad por polvo de cosecha.",
            "Limpieza de modulos realizada.",
            12,
        ),
        (
            "Sede Rionegro Urgencias",
            "temperatura_bateria",
            "Rack de baterias alcanzo 39 C por ventilacion insuficiente.",
            "resuelta",
            "media",
            "Filtro de ventilacion saturado.",
            "Filtro reemplazado y temperatura normalizada.",
            18,
        ),
        (
            "Hub Cartagena",
            "bateria_baja",
            "Autonomia nocturna bajando por nueva carga de camaras.",
            "activa",
            "baja",
            "Carga adicional no registrada en dimensionamiento.",
            "Actualizar perfil de carga y proponer expansion.",
            3,
        ),
        (
            "Biblioteca Central",
            "produccion_baja",
            "Sombra parcial detectada en arreglo del ala oriental.",
            "activa",
            "media",
            "Obra civil temporal genera sombra al mediodia.",
            "Ajustar strings temporalmente y coordinar retiro.",
            4,
        ),
    ]
    alertas = {}
    for (
        instalacion_nombre,
        tipo_nombre,
        mensaje,
        estado,
        severidad,
        causa,
        accion,
        age_days,
    ) in specs:
        instalacion = instalaciones[instalacion_nombre]
        alerta = Alerta.objects.filter(
            instalacion=instalacion,
            mensaje=mensaje,
        ).first()
        values = {
            "tipoalerta": tipos_alerta[tipo_nombre],
            "domicilio": None,
            "instalacion": instalacion,
            "mensaje": mensaje,
            "estado": estado,
            "severidad": severidad,
            "causa_probable": causa,
            "accion_sugerida": accion,
            "resuelta_por": (
                usuarios.get("tecnico.jorge@soleim.local")
                if estado == "resuelta"
                else None
            ),
        }
        if not alerta:
            safe_values = {**values, "estado": "resuelta"}
            alerta = Alerta.objects.create(**safe_values)
        for field, value in values.items():
            setattr(alerta, field, value)
        alerta.save()
        Alerta.objects.filter(pk=alerta.pk).update(
            fecha=now - timedelta(days=age_days, hours=2 + age_days)
        )
        alerta.refresh_from_db()
        alertas[mensaje] = alerta
    return alertas


def _seed_mantenimientos(instalaciones, planes, today):
    specs = [
        ("Instalacion Demo", -12, "completado", "Visita demo completada."),
        ("Laboratorio I+D Bogota", 4, "programado", "Revision de inversores."),
        ("Planta Palmira Cubierta 1", 6, "programado", "Ventana con produccion baja."),
        ("Centro Distribucion Cali", 1, "en_proceso", "Acceso a cubierta autorizado."),
        ("Clinica Torre A", 2, "programado", "Prioridad por carga critica."),
        ("Sede Rionegro Urgencias", -18, "completado", "Baterias normalizadas."),
        ("Biblioteca Central", 9, "programado", "Revision posterior a sombra."),
        ("Laboratorios Ingenieria", 3, "programado", "Revision de gateway IoT."),
        ("Bodega Refrigerada Barranquilla", 0, "en_proceso", "Banco B en diagnostico."),
        ("Hub Cartagena", 14, "programado", "Dimensionamiento de expansion."),
    ]
    mantenimientos = {}
    for instalacion_nombre, offset, estado, notas in specs:
        instalacion = instalaciones[instalacion_nombre]
        plan = planes[instalacion.tipo_sistema]
        fecha = today + timedelta(days=offset)
        mantenimiento = Mantenimiento.objects.filter(
            instalacion=instalacion,
            plan=plan,
            fecha_programada=fecha,
        ).first()
        values = {
            "instalacion": instalacion,
            "plan": plan,
            "fecha_programada": fecha,
            "estado": estado,
            "notas": notas,
        }
        if not mantenimiento:
            mantenimiento = Mantenimiento.objects.create(**values)
        else:
            for field, value in values.items():
                setattr(mantenimiento, field, value)
            mantenimiento.save()
        mantenimientos[instalacion_nombre] = mantenimiento
    return mantenimientos


def _seed_ordenes(
    instalaciones,
    mantenimientos,
    alertas,
    usuarios,
    tecnicos,
    today,
    now,
):
    tech_users = {email: perfil.usuario for email, perfil in tecnicos.items()}
    system = usuarios["system"]
    specs = [
        {
            "instalacion": "Clinica Torre A",
            "alerta_msg": "Inversor 2 reporta reconexion intermitente.",
            "tipo": "correctivo",
            "prioridad": "urgente",
            "estado": "asignada",
            "titulo": "Restablecer inversor critico Clinica Torre A",
            "descripcion": "Falla intermitente en inversor 2 con impacto en respaldo.",
            "tecnico": "tecnico.jorge@soleim.local",
            "creado_por": "cliente.clinica@soleim.local",
            "sla": 4,
            "age_hours": 5,
        },
        {
            "instalacion": "Bodega Refrigerada Barranquilla",
            "alerta_msg": "Banco B registra autonomia menor a 45 minutos.",
            "tipo": "correctivo",
            "prioridad": "alta",
            "estado": "en_progreso",
            "titulo": "Diagnosticar autonomia Banco B",
            "descripcion": "Validar BMS, celdas desbalanceadas y cargas nocturnas.",
            "tecnico": "tecnico.esteban@soleim.local",
            "creado_por": "cliente.frioexpress@soleim.local",
            "sla": 6,
            "age_hours": 10,
        },
        {
            "instalacion": "Laboratorios Ingenieria",
            "alerta_msg": "Gateway IoT sin reporte estable desde la madrugada.",
            "tipo": "correctivo",
            "prioridad": "media",
            "estado": "abierta",
            "titulo": "Revisar gateway IoT laboratorios",
            "descripcion": "Comunicacion intermitente del gateway principal.",
            "tecnico": None,
            "creado_por": "cliente.campus@soleim.local",
            "sla": 24,
            "age_hours": 8,
        },
        {
            "instalacion": "Centro Distribucion Cali",
            "alerta_msg": "Mantenimiento preventivo vencido hace 5 dias.",
            "tipo": "preventivo",
            "prioridad": "media",
            "estado": "en_progreso",
            "titulo": "Ejecutar preventivo vencido Centro Distribucion Cali",
            "descripcion": "Checklist preventivo y limpieza de cubierta.",
            "tecnico": "tecnico.paula@soleim.local",
            "creado_por": "cliente.andina@soleim.local",
            "mantenimiento": "Centro Distribucion Cali",
            "sla": 16,
            "age_hours": 28,
        },
        {
            "instalacion": "Clinica Torre A",
            "tipo": "preventivo",
            "prioridad": "alta",
            "estado": "asignada",
            "titulo": "Preventivo premium respaldo Clinica Torre A",
            "descripcion": "Revision preventiva por contrato premium.",
            "tecnico": "tecnico.jorge@soleim.local",
            "creado_por": "cliente.clinica@soleim.local",
            "mantenimiento": "Clinica Torre A",
            "sla": 8,
            "age_hours": 3,
        },
        {
            "instalacion": "Planta Palmira Cubierta 1",
            "tipo": "inspeccion",
            "prioridad": "media",
            "estado": "completada",
            "titulo": "Inspeccion post limpieza modulos Palmira",
            "descripcion": "Validar recuperacion de produccion luego de limpieza.",
            "tecnico": "tecnico.paula@soleim.local",
            "creado_por": "cliente.andina@soleim.local",
            "sla": 24,
            "age_hours": 36,
            "resolved_hours": 10,
            "notas": "Produccion recuperada y sin puntos calientes.",
        },
        {
            "instalacion": "Sede Rionegro Urgencias",
            "tipo": "correctivo",
            "prioridad": "media",
            "estado": "cerrada",
            "titulo": "Reemplazo filtro ventilacion rack baterias",
            "descripcion": "Temperatura de rack elevada por filtro saturado.",
            "tecnico": "tecnico.jorge@soleim.local",
            "creado_por": "cliente.clinica@soleim.local",
            "mantenimiento": "Sede Rionegro Urgencias",
            "sla": 12,
            "age_hours": 72,
            "resolved_hours": 18,
            "notas": "Filtro reemplazado, rack estabilizado en 27 C.",
        },
        {
            "instalacion": "Biblioteca Central",
            "tipo": "inspeccion",
            "prioridad": "baja",
            "estado": "abierta",
            "titulo": "Evaluar sombra temporal ala oriental",
            "descripcion": "Inspeccionar sombra generada por obra temporal.",
            "tecnico": None,
            "creado_por": "cliente.campus@soleim.local",
            "sla": 48,
            "age_hours": 2,
        },
        {
            "instalacion": "Laboratorio I+D Bogota",
            "tipo": "preventivo",
            "prioridad": "media",
            "estado": "asignada",
            "titulo": "Preventivo bimestral laboratorio I+D",
            "descripcion": "Revision de inversor y tableros AC.",
            "tecnico": "tecnico.maria@soleim.local",
            "creado_por": "operaciones@soleim.local",
            "mantenimiento": "Laboratorio I+D Bogota",
            "sla": 48,
            "age_hours": 1,
        },
        {
            "instalacion": "Hub Cartagena",
            "tipo": "inspeccion",
            "prioridad": "baja",
            "estado": "asignada",
            "titulo": "Levantamiento expansion autonomia Hub Cartagena",
            "descripcion": "Medir carga nocturna y propuesta de expansion.",
            "tecnico": "tecnico.oscar@soleim.local",
            "creado_por": "cliente.frioexpress@soleim.local",
            "mantenimiento": "Hub Cartagena",
            "sla": 24,
            "age_hours": 4,
        },
        {
            "instalacion": "Instalacion Demo",
            "tipo": "preventivo",
            "prioridad": "media",
            "estado": "cerrada",
            "titulo": "Mantenimiento demo completado",
            "descripcion": "Orden demo para mostrar cierre y evidencia.",
            "tecnico": "tecnico.maria@soleim.local",
            "creado_por": "operaciones@soleim.local",
            "mantenimiento": "Instalacion Demo",
            "sla": 24,
            "age_hours": 96,
            "resolved_hours": 6,
            "notas": "Sistema estable y parametros dentro de rango.",
        },
    ]
    ordenes = {}
    for spec in specs:
        instalacion = instalaciones[spec["instalacion"]]
        alerta = alertas.get(spec.get("alerta_msg"))
        mantenimiento = mantenimientos.get(spec.get("mantenimiento"))
        tecnico = tech_users.get(spec.get("tecnico"))
        creado_por = usuarios.get(spec.get("creado_por"), system)
        orden = _ensure_order(
            instalacion=instalacion,
            titulo=spec["titulo"],
            defaults={
                "alerta": alerta,
                "mantenimiento": mantenimiento,
                "tipo": spec["tipo"],
                "prioridad": spec["prioridad"],
                "estado": spec["estado"],
                "descripcion": spec["descripcion"],
                "notas_resolucion": spec.get("notas", ""),
                "asignado_a": tecnico,
                "creado_por": creado_por,
                "sla_objetivo_horas": spec["sla"],
            },
        )
        creada_at = now - timedelta(hours=spec["age_hours"])
        asignada_at = creada_at + timedelta(hours=1) if tecnico else None
        iniciada_at = None
        completada_at = None
        cerrada_at = None
        if spec["estado"] in ("en_progreso", "completada", "cerrada"):
            iniciada_at = (asignada_at or creada_at) + timedelta(hours=1)
        if spec["estado"] in ("completada", "cerrada"):
            completada_at = creada_at + timedelta(hours=spec.get("resolved_hours", 4))
        if spec["estado"] == "cerrada":
            cerrada_at = (completada_at or now) + timedelta(hours=2)

        OrdenTrabajo.objects.filter(pk=orden.pk).update(
            creada_at=creada_at,
            asignada_at=asignada_at,
            iniciada_at=iniciada_at,
            completada_at=completada_at,
            cerrada_at=cerrada_at,
        )
        orden.refresh_from_db()
        if mantenimiento and mantenimiento.orden_trabajo_id != orden.idorden:
            mantenimiento.orden_trabajo = orden
            mantenimiento.save(update_fields=["orden_trabajo"])
        ordenes[spec["titulo"]] = orden
    return ordenes


def _ensure_order(instalacion, titulo, defaults):
    alerta = defaults.get("alerta")
    mantenimiento = defaults.get("mantenimiento")
    qs = OrdenTrabajo.objects.filter(instalacion=instalacion)
    if alerta:
        orden = qs.filter(alerta=alerta).first()
    elif mantenimiento:
        orden = qs.filter(mantenimiento=mantenimiento).first()
    else:
        orden = None
    if not orden:
        orden = qs.filter(titulo=titulo).first()
    if not orden:
        return OrdenTrabajo.objects.create(
            instalacion=instalacion, titulo=titulo, **defaults
        )

    for field, value in defaults.items():
        setattr(orden, field, value)
    orden.titulo = titulo
    orden.save()
    return orden


def _seed_configuraciones(domicilios, instalaciones, alertas):
    specs = [
        (
            "operaciones@soleim.local",
            "Operaciones Bogota",
            "auto",
            "Instalacion Demo",
        ),
        (
            "cliente.andina@soleim.local",
            "Alertas Andina Foods",
            "solar",
            "Planta Palmira Cubierta 1",
        ),
        (
            "cliente.clinica@soleim.local",
            "Clinica energia critica",
            "electrica",
            "Clinica Torre A",
        ),
        (
            "cliente.frioexpress@soleim.local",
            "Cadena de frio",
            "auto",
            "Bodega Refrigerada Barranquilla",
        ),
        (
            "cliente.campus@soleim.local",
            "Campus monitoreo",
            "solar",
            "Laboratorios Ingenieria",
        ),
    ]
    active_alerts = [alerta for alerta in alertas.values() if alerta.estado == "activa"]
    for email, nombre, prioridad, instalacion_nombre in specs:
        config = _get_or_update(
            ConfiguracionUser,
            {"domicilio": domicilios[email], "nombre": nombre},
            domicilio=domicilios[email],
            nombre=nombre,
            instalacion=instalaciones[instalacion_nombre],
            prioridad=prioridad,
            notificaciones_email=True,
        )
        config.alertas_activas.set(
            [a for a in active_alerts if a.instalacion_id == config.instalacion_id]
        )


def _seed_comentarios_y_evidencias(ordenes, usuarios):
    comentarios = [
        (
            "Restablecer inversor critico Clinica Torre A",
            "tecnico.jorge@soleim.local",
            "En ruta a la sede, llevo modulo de comunicacion de reemplazo.",
        ),
        (
            "Diagnosticar autonomia Banco B",
            "tecnico.esteban@soleim.local",
            "Banco aislado para pruebas de descarga controlada.",
        ),
        (
            "Ejecutar preventivo vencido Centro Distribucion Cali",
            "tecnico.paula@soleim.local",
            "Checklist iniciado, se detecta suciedad en strings del costado norte.",
        ),
        (
            "Preventivo premium respaldo Clinica Torre A",
            "cliente.clinica@soleim.local",
            "Por favor coordinar ingreso por urgencias despues de las 2 PM.",
        ),
        (
            "Evaluar sombra temporal ala oriental",
            "cliente.campus@soleim.local",
            "Obra civil confirma retiro de andamios para el viernes.",
        ),
    ]
    for orden_titulo, email, texto in comentarios:
        orden = ordenes[orden_titulo]
        ComentarioOrden.objects.get_or_create(
            orden=orden,
            usuario=usuarios[email],
            tipo="comentario",
            texto=texto,
        )

    evidencias = [
        (
            "Inspeccion post limpieza modulos Palmira",
            "foto",
            "ordenes/demo/palmira_limpieza.jpg",
            "Foto posterior a limpieza de modulos.",
            "tecnico.paula@soleim.local",
        ),
        (
            "Reemplazo filtro ventilacion rack baterias",
            "documento",
            "ordenes/demo/rionegro_acta_servicio.pdf",
            "Acta de servicio firmada por la sede.",
            "tecnico.jorge@soleim.local",
        ),
        (
            "Mantenimiento demo completado",
            "documento",
            "ordenes/demo/instalacion_demo_acta.txt",
            "Checklist demo completado.",
            "tecnico.maria@soleim.local",
        ),
    ]
    for orden_titulo, tipo, archivo, descripcion, email in evidencias:
        EvidenciaOrden.objects.get_or_create(
            orden=ordenes[orden_titulo],
            descripcion=descripcion,
            defaults={
                "tipo": tipo,
                "archivo": archivo,
                "subido_por": usuarios[email],
            },
        )


def _seed_plantillas_y_notificaciones(usuarios, ordenes, instalaciones, now):
    templates = [
        (
            "demo_resumen_empresa",
            "Resumen operativo {empresa}",
            "Tienes {ordenes} ordenes activas y {alertas} alertas por revisar.",
            ["in_app", "email"],
        ),
        (
            "demo_mantenimiento",
            "Mantenimiento programado {instalacion}",
            "La visita preventiva esta programada para {fecha}.",
            ["in_app"],
        ),
    ]
    for clave, asunto, cuerpo, canales in templates:
        _get_or_update(
            PlantillaNotificacion,
            {"clave": clave},
            clave=clave,
            asunto=asunto,
            cuerpo_txt=cuerpo,
            cuerpo_html="",
            canales_default=canales,
            activo=True,
        )

    notifications = [
        (
            "cliente.clinica@soleim.local",
            "in_app",
            "Orden critica asignada",
            f"{ordenes['Restablecer inversor critico Clinica Torre A'].codigo} ya fue asignada a Jorge Ramirez.",
            "enviada",
            "/operaciones/ordenes",
        ),
        (
            "tecnico.jorge@soleim.local",
            "in_app",
            "Nueva orden urgente",
            "Restablecer inversor critico Clinica Torre A requiere atencion inmediata.",
            "pendiente",
            "/tecnicos/mis-ordenes",
        ),
        (
            "cliente.frioexpress@soleim.local",
            "email",
            "Autonomia en diagnostico",
            "El Banco B esta en pruebas de descarga controlada.",
            "enviada",
            "/alertas",
        ),
        (
            "cliente.campus@soleim.local",
            "in_app",
            "Gateway pendiente de revision",
            "Se creo una orden para revisar comunicaciones del laboratorio.",
            "leida",
            "/operaciones/ordenes",
        ),
        (
            "operaciones@soleim.local",
            "in_app",
            "Instalaciones listas para revisar",
            f"{instalaciones['Laboratorio I+D Bogota'].nombre} tiene preventivo asignado.",
            "pendiente",
            "/mantenimiento",
        ),
    ]
    for email, canal, asunto, cuerpo, estado, enlace in notifications:
        notif, _ = Notificacion.objects.get_or_create(
            usuario=usuarios[email],
            asunto=asunto,
            cuerpo=cuerpo,
            defaults={
                "canal": canal,
                "enlace": enlace,
                "estado": estado,
                "metadata": {"demo_seed": True},
            },
        )
        Notificacion.objects.filter(pk=notif.pk).update(
            canal=canal,
            enlace=enlace,
            estado=estado,
            enviada_at=(
                now - timedelta(hours=2) if estado in ("enviada", "leida") else None
            ),
            leida_at=now - timedelta(hours=1) if estado == "leida" else None,
            metadata={"demo_seed": True},
        )


def _seed_auditoria(usuarios, empresas, instalaciones, ordenes):
    events = [
        (
            usuarios["admin.demo@soleim.local"],
            "seed_demo_data",
            "Sistema",
            None,
            {"tablas": "no_telemetria", "version": "2026-04-29"},
        ),
        (
            usuarios["operaciones@soleim.local"],
            "crear_instalacion",
            "Instalacion",
            instalaciones["Laboratorio I+D Bogota"].idinstalacion,
            {"empresa": empresas["Soleim Demo"].nombre, "demo_seed": True},
        ),
        (
            usuarios["cliente.clinica@soleim.local"],
            "solicitar_soporte",
            "OrdenTrabajo",
            ordenes["Restablecer inversor critico Clinica Torre A"].idorden,
            {"prioridad": "urgente", "demo_seed": True},
        ),
        (
            usuarios["tecnico.paula@soleim.local"],
            "subir_evidencia",
            "OrdenTrabajo",
            ordenes["Inspeccion post limpieza modulos Palmira"].idorden,
            {"tipo": "foto", "demo_seed": True},
        ),
        (
            usuarios["cliente.frioexpress@soleim.local"],
            "revisar_alerta",
            "Instalacion",
            instalaciones["Bodega Refrigerada Barranquilla"].idinstalacion,
            {"severidad": "alta", "demo_seed": True},
        ),
    ]
    for usuario, accion, entidad, entidad_id, detalle in events:
        exists = EventoAuditoria.objects.filter(
            accion=accion,
            entidad=entidad,
            entidad_id=entidad_id,
            usuario=usuario,
        ).exists()
        if not exists:
            EventoAuditoria.objects.create(
                usuario=usuario,
                accion=accion,
                entidad=entidad,
                entidad_id=entidad_id,
                detalle=detalle,
                ip_address="127.0.0.1",
            )
