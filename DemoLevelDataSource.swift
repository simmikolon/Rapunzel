//
//  DemoLevelDataSource.swift
//  Rapunzel
//
//  Created by Simon Kemper on 09.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

class DemoLevelDataSource: LevelDataSource {
    
    let _levelLayers: [LevelLayer]
    
    func levelLayers() -> [LevelLayer] {
        return _levelLayers
    }
    
    var loadableTypes: [ResourceLoadableType.Type] = [
        
        HairLayerEntity.self,
        TowerLayerEntity.self,
        TreeLayerEntity.self,
        BackgroundLayerEntity.self,
        FarBackgroundLayerEntity.self,
        HairRibbonPlatformEntity.self,
        LeftBranchPlatformEntity.self,
        BranchPlatformEntity.self,
        PlayerEntity.self
    ]
    
    lazy var _pattern: Pattern = {
        
        let pattern = Pattern(withNumberOfBeats: 2)
        
        pattern.beats[0] = Beat(withType: .NotEmpty)
        pattern.beats[0].elements.append(BeatElement(type: .LeftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "HairLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = HairRibbonPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = 20
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        
        pattern.beats[0].elements.append(BeatElement(type: .LeftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "TreeLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = LeftBranchPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = 320
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        
        /**/
        
        pattern.beats[1] = Beat(withType: .NotEmpty)
        pattern.beats[1].elements.append(BeatElement(type: .LeftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "HairLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = HairRibbonPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = -20
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        
        pattern.beats[1].elements.append(BeatElement(type: .LeftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "TreeLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = BranchPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = -320
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        
        return pattern
    }()
    
    func demoPattern() -> Pattern {
        
        return _pattern
    }
    
    init() {
        
        _levelLayers = [
            
            LevelLayer(name: "ASD", creationHandler: { (cameraComponent) -> LayerEntity in

                let layerEntity = HairLayerEntity(withParallaxFactor: 2.0, cameraComponent: cameraComponent, zPosition: -1)
                layerEntity.name = "HairLayerEntity"
                return layerEntity
                
            }),
            
            LevelLayer(name: "ASD", creationHandler: { (cameraComponent) -> LayerEntity in
                
                let layerEntity = TowerLayerEntity(withParallaxFactor: 2.0, cameraComponent: cameraComponent, zPosition: -2)
                layerEntity.name = "TowerLayerEntity"
                return layerEntity
                
            }),
            
            LevelLayer(name: "ASD", creationHandler: { (cameraComponent) -> LayerEntity in

                let layerEntity = TreeLayerEntity(withParallaxFactor: 1.5, cameraComponent: cameraComponent, zPosition: 1)
                layerEntity.name = "TreeLayerEntity"
                return layerEntity
                
            }),
            
            LevelLayer(name: "ASD", creationHandler: { (cameraComponent) -> LayerEntity in
                
                let layerEntity = BackgroundLayerEntity(withParallaxFactor: 3.0, cameraComponent: cameraComponent, zPosition: -3)
                layerEntity.name = "BackgroundLayerEntity"
                return layerEntity
                
            }),
            
            LevelLayer(name: "ASD", creationHandler: { (cameraComponent) -> LayerEntity in
                
                let layerEntity = FarBackgroundLayerEntity(withParallaxFactor: 8.0, cameraComponent: cameraComponent, zPosition: -5)
                layerEntity.name = "FarBackgroundLayerEntity"
                return layerEntity
                
            })
        ]
    }
}