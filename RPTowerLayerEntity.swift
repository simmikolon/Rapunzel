//
//  TowerLayerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 24.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class TowerLayerEntity: LayerEntity, ResourceLoadableType {
    
    static var tileSize = CGSize(width: 1364, height: 192)
    static var atlas: SKTextureAtlas!
    static var tileSet: TileSet!
    
    // MARK: Components
    
    var tileComponent: TileComponent!
    
    // MARK: Initialisation
    
    override init(withParallaxFactor factor: CGFloat = 1.0, cameraComponent: CameraComponent, zPosition: CGFloat = 0.0) {
        
        super.init(withParallaxFactor: factor, cameraComponent: cameraComponent, zPosition: zPosition)
        
        self.tileComponent = TileComponent(withEntity: self, tileSet: TowerLayerEntity.tileSet)
        
        addComponent(self.tileComponent)
        
        self.name = "TowerLayerEntity"
    }
}

extension TowerLayerEntity {
    
    static var resourcesNeedLoading: Bool {
        return atlas == nil
    }
    
    static func loadResourcesWithCompletionHandler(completionHandler: () -> ()) {
        
        atlas = SKTextureAtlas(named: "RPTowerLayer")
        atlas.preloadWithCompletionHandler { () -> Void in

            tileSet = TileComponent.tileSetFromAtlas(atlas)
            completionHandler()
        }
    }
    
    static func purgeResources() {
        
        atlas = nil
    }
    
}