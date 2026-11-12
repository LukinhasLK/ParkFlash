package com.parkflash.repositorio;

import com.parkflash.dominio.Ficha;
import com.parkflash.dominio.Turno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface FichaRepository extends JpaRepository<Ficha, Long> {

    List<Ficha> findAllByOrderByDataDescIdDesc();

    List<Ficha> findByDataBetweenOrderByDataDescIdDesc(LocalDate inicio, LocalDate fim);

    boolean existsByDataAndUnidadeIdAndTurno(LocalDate data, Long unidadeId, Turno turno);

    boolean existsByDataAndUnidadeIdAndTurnoAndIdNot(LocalDate data, Long unidadeId, Turno turno, Long id);

    boolean existsByUnidadeId(Long unidadeId);

    @Query("select count(f) > 0 from Ficha f join f.manobristas m where m.manobristaId = :manobristaId")
    boolean usaManobrista(Long manobristaId);
}
