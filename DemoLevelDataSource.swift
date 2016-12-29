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
        PlayerEntity.self,
        WindowPlatformEntity.self,
        CollectableEntity.self
    ]
    
    lazy var _pattern: Pattern = {
        
        let pattern = Pattern(withNumberOfBeats: 12)
        
        pattern.beats[0] = Beat(withType: .notEmpty)
        pattern.beats[0].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = CollectableEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = 150
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        pattern.beats[0].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
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
        pattern.beats[1] = Beat(withType: .notEmpty)
        pattern.beats[1].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = CollectableEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = 150
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        pattern.beats[2] = Beat(withType: .notEmpty)
        pattern.beats[2].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = WindowPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = -150
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        pattern.beats[2].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = WindowPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = 150
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        pattern.beats[2].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = CollectableEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = 150
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })

        pattern.beats[3] = Beat(withType: .notEmpty)
        pattern.beats[3].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
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
        
        pattern.beats[3].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = CollectableEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = -150
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        
        pattern.beats[4] = Beat(withType: .notEmpty)
        pattern.beats[4].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = CollectableEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = -150
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        pattern.beats[4].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "TreeLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = LeftBranchPlatformEntity(isBreakable: false, isBottomCollidable: true)
            platform.renderComponent.node.position.x = 200
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        pattern.beats[5] = Beat(withType: .notEmpty)
        pattern.beats[5].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = WindowPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = 150
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        pattern.beats[5].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = WindowPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = -150
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        pattern.beats[5].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = CollectableEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = -150
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        
        pattern.beats[6] = Beat(withType: .notEmpty)
        pattern.beats[6].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = CollectableEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = 150
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        pattern.beats[6].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
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
        pattern.beats[7] = Beat(withType: .notEmpty)
        pattern.beats[7].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = CollectableEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = 150
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        pattern.beats[8] = Beat(withType: .notEmpty)
        pattern.beats[8].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = CollectableEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = 150
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        pattern.beats[8].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = WindowPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = -150
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        pattern.beats[8].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = WindowPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = 150
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        pattern.beats[9] = Beat(withType: .notEmpty)
        pattern.beats[9].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
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
        
        pattern.beats[10] = Beat(withType: .notEmpty)
        pattern.beats[10].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "TreeLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = BranchPlatformEntity(isBreakable: false, isBottomCollidable: true)
            platform.renderComponent.node.position.x = -200
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        pattern.beats[11] = Beat(withType: .notEmpty)
        pattern.beats[11].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = WindowPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = 150
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        pattern.beats[11].elements.append(BeatElement(type: .leftTreePlatform) { (offset, entityManagerComponent) -> PlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "ActionLayerEntity") as? LayerEntity else {
                fatalError()
            }
            
            let platform = WindowPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = -150
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
                
                let layerEntity = LayerEntity(withParallaxFactor: 2.0, cameraComponent: cameraComponent, zPosition: -1)
                layerEntity.name = "ActionLayerEntity"
                return layerEntity
                
            }),
            
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
