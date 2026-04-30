from django.db import models
from django.db.models import Count, Q


class Especialidad(models.Model):
    """Catálogo de especialidades técnicas (paneles, baterías, inversores, etc.)."""

    idespecialidad = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=64, unique=True)
    descripcion = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "especialidad"
        ordering = ["nombre"]
        verbose_name = "Especialidad"
        verbose_name_plural = "Especialidades"

    def __str__(self):
        return self.nombre


class PerfilTecnicoManager(models.Manager):
    """Manager con helpers de despacho."""

    def disponibles_en_zona(
        self, ciudad, especialidad=None, empresa=None, prestador=None
    ):
        """
        Devuelve los técnicos disponibles para atender una instalación en `ciudad`,
        ordenados por carga (menor número de órdenes activas primero).

        - `ciudad` debe coincidir con alguna de sus zonas de cobertura.
        - `especialidad` opcional para filtrar por skill.
        - `empresa` opcional: en B2B normalmente se filtra por empresa del tenant.
        """
        qs = self.get_queryset().filter(disponible=True, zonas=ciudad)
        if especialidad is not None:
            qs = qs.filter(especialidades=especialidad)
        if empresa is not None:
            qs = qs.filter(empresa=empresa)
        if prestador is not None:
            qs = qs.filter(prestador=prestador)

        return qs.annotate(
            carga=Count(
                "usuario__ordenes_asignadas",
                filter=Q(
                    usuario__ordenes_asignadas__estado__in=["asignada", "en_progreso"]
                ),
                distinct=True,
            )
        ).order_by("carga", "usuario__nombre")


class PerfilTecnico(models.Model):
    """
    Perfil de un técnico de campo. Extiende `core.Usuario` 1:1.
    Un usuario sólo puede tener un perfil de técnico, y siempre pertenece a una empresa.
    """

    idperfil = models.AutoField(primary_key=True)
    usuario = models.OneToOneField(
        "core.Usuario",
        on_delete=models.CASCADE,
        related_name="perfil_tecnico",
    )
    empresa = models.ForeignKey(
        "core.Empresa",
        on_delete=models.CASCADE,
        related_name="tecnicos",
    )
    prestador = models.ForeignKey(
        "core.PrestadorServicio",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="tecnicos",
    )
    cedula = models.CharField(max_length=32, unique=True)
    telefono = models.CharField(max_length=32, blank=True)
    especialidades = models.ManyToManyField(
        Especialidad,
        related_name="tecnicos",
        blank=True,
    )
    zonas = models.ManyToManyField(
        "core.Ciudad",
        related_name="tecnicos",
        blank=True,
        help_text="Ciudades donde el técnico puede ser despachado.",
    )
    disponible = models.BooleanField(
        default=True,
        help_text="Si el técnico está disponible para nuevas asignaciones.",
    )
    area_profesional = models.CharField(max_length=120, blank=True)
    resumen_profesional = models.TextField(blank=True)
    hoja_vida = models.FileField(
        upload_to="tecnicos/hojas_vida/",
        null=True,
        blank=True,
    )
    estudios = models.JSONField(default=list, blank=True)
    licencia_vence = models.DateField(null=True, blank=True)
    notas = models.TextField(blank=True)
    creado_at = models.DateTimeField(auto_now_add=True)
    actualizado_at = models.DateTimeField(auto_now=True)

    objects = PerfilTecnicoManager()

    class Meta:
        db_table = "perfil_tecnico"
        verbose_name = "Perfil de técnico"
        verbose_name_plural = "Perfiles de técnico"
        indexes = [
            models.Index(fields=["empresa", "disponible"], name="perfil_emp_disp_idx"),
        ]

    def __str__(self):
        return f"{self.usuario.nombre} ({self.empresa.nombre})"
