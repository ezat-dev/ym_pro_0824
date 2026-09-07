package com.mes.dao;

import java.util.List;

import com.mes.domain.quality.Cpk;
import com.mes.domain.quality.Ppk;
import com.mes.domain.quality.Fproof;
import com.mes.domain.quality.TempUniform;
import com.mes.domain.quality.Hardness;
import com.mes.domain.quality.Nonconform;

/**
 * 품질관리 전체 메뉴의 데이터 접근 계약.
 */
public interface QualityDao {

    List<Cpk> selectCpkList(int offset, int size, String keyword);

    long selectCpkCount(String keyword);

    List<Ppk> selectPpkList(int offset, int size, String keyword);

    long selectPpkCount(String keyword);

    List<Fproof> selectFproofList(int offset, int size, String keyword);

    long selectFproofCount(String keyword);

    List<TempUniform> selectTempUniformList(String equipName, String judgment, String from, String to);

    List<String> selectTempUniformEquipNames();

    TempUniform selectTempUniformById(Long id);

    void insertTempUniform(TempUniform tempUniform);

    void updateTempUniform(TempUniform tempUniform);

    void updateTempUniformFile(Long id, String fileName, String origFileName, long fileSize);

    void softDeleteTempUniform(Long id);

    List<Hardness> selectHardnessList(int offset, int size, String keyword);

    long selectHardnessCount(String keyword);

    List<Nonconform> selectNonconformList(int offset, int size, String keyword);

    long selectNonconformCount(String keyword);

}
