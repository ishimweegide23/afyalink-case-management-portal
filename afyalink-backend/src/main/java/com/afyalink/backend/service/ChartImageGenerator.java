package com.afyalink.backend.service;

import com.afyalink.backend.dto.report.DateValueDto;
import com.afyalink.backend.dto.report.LabelValueDto;
import org.jfree.chart.ChartFactory;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.plot.CategoryPlot;
import org.jfree.chart.plot.PiePlot;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.chart.renderer.category.BarRenderer;
import org.jfree.data.category.DefaultCategoryDataset;
import org.jfree.data.general.DefaultPieDataset;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Component
public class ChartImageGenerator {

    private static final Color TEAL = new Color(13, 148, 136);
    private static final Color INDIGO = new Color(99, 102, 241);
    private static final Color AMBER = new Color(245, 158, 11);
    private static final Color SLATE = new Color(100, 116, 139);

    public byte[] createBarChart(List<LabelValueDto> data, String title, int width, int height) throws IOException {
        DefaultCategoryDataset dataset = new DefaultCategoryDataset();
        if (data != null) {
            for (LabelValueDto item : data) {
                if (item.getLabel() != null) {
                    dataset.addValue(item.getValue() != null ? item.getValue().doubleValue() : 0, "Value", item.getLabel());
                }
            }
        }
        if (dataset.getRowCount() == 0) {
            dataset.addValue(0, "Value", "No data");
        }
        JFreeChart chart = ChartFactory.createBarChart(
                title, "", "", dataset,
                PlotOrientation.VERTICAL, false, true, false);
        styleChart(chart);
        CategoryPlot plot = chart.getCategoryPlot();
        BarRenderer renderer = (BarRenderer) plot.getRenderer();
        renderer.setSeriesPaint(0, TEAL);
        return toPng(chart, width, height);
    }

    public byte[] createHorizontalBarChart(List<LabelValueDto> data, String title, int width, int height) throws IOException {
        DefaultCategoryDataset dataset = new DefaultCategoryDataset();
        if (data != null) {
            for (LabelValueDto item : data) {
                if (item.getLabel() != null) {
                    dataset.addValue(item.getValue() != null ? item.getValue().doubleValue() : 0, "Value", item.getLabel());
                }
            }
        }
        if (dataset.getRowCount() == 0) {
            dataset.addValue(0, "Value", "No data");
        }
        JFreeChart chart = ChartFactory.createBarChart(
                title, "", "", dataset,
                PlotOrientation.HORIZONTAL, false, true, false);
        styleChart(chart);
        ((BarRenderer) chart.getCategoryPlot().getRenderer()).setSeriesPaint(0, TEAL);
        return toPng(chart, width, height);
    }

    public byte[] createPieChart(List<LabelValueDto> data, String title, int width, int height) throws IOException {
        DefaultPieDataset<String> dataset = new DefaultPieDataset<>();
        if (data != null && !data.isEmpty()) {
            for (LabelValueDto item : data) {
                if (item.getLabel() != null && item.getValue() != null && item.getValue().doubleValue() > 0) {
                    dataset.setValue(item.getLabel(), item.getValue().doubleValue());
                }
            }
        }
        if (dataset.getKeys().isEmpty()) {
            dataset.setValue("No data", 1);
        }
        JFreeChart chart = ChartFactory.createPieChart(title, dataset, true, true, false);
        styleChart(chart);
        @SuppressWarnings("unchecked")
        PiePlot<String> plot = (PiePlot<String>) chart.getPlot();
        plot.setSectionPaint(0, TEAL);
        plot.setSectionPaint(1, INDIGO);
        plot.setSectionPaint(2, AMBER);
        plot.setSectionPaint(3, SLATE);
        return toPng(chart, width, height);
    }

    public byte[] createLineChart(List<DateValueDto> data, String title, int width, int height) throws IOException {
        DefaultCategoryDataset dataset = new DefaultCategoryDataset();
        if (data != null) {
            for (DateValueDto item : data) {
                if (item.getDate() != null) {
                    dataset.addValue(item.getValue() != null ? item.getValue() : 0, "Activity", item.getDate());
                }
            }
        }
        if (dataset.getRowCount() == 0) {
            dataset.addValue(0, "Activity", "—");
        }
        JFreeChart chart = ChartFactory.createLineChart(
                title, "Date", "Value", dataset,
                PlotOrientation.VERTICAL, true, true, false);
        styleChart(chart);
        chart.getCategoryPlot().getRenderer().setSeriesPaint(0, INDIGO);
        return toPng(chart, width, height);
    }

    private void styleChart(JFreeChart chart) {
        chart.setBackgroundPaint(Color.WHITE);
        chart.getTitle().setFont(new Font("SansSerif", Font.BOLD, 14));
        chart.getTitle().setPaint(new Color(15, 23, 42));
        if (chart.getPlot() != null) {
            chart.getPlot().setBackgroundPaint(new Color(248, 250, 252));
            chart.getPlot().setOutlinePaint(new Color(226, 232, 240));
        }
    }

    private byte[] toPng(JFreeChart chart, int width, int height) throws IOException {
        BufferedImage image = chart.createBufferedImage(width, height);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);
        return baos.toByteArray();
    }
}
