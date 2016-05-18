//
//  HairLayerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class HairLayerEntity: LayerEntity, ResourceLoadableType {
    
    static var tileSize = CGSize(width: 1364, height: 192)
    static var atlas: SKTextureAtlas!
    static var tileSet: TileSet!
    
    // MARK: Components
    
    var tileComponent: TileComponent!
    
    // MARK: Initialisation
    
    override init(withParallaxFactor factor: CGFloat = 1.0, cameraComponent: CameraComponent, zPosition: CGFloat = 0.0) {
        
        super.init(withParallaxFactor: factor, cameraComponent: cameraComponent, zPosition: zPosition)
        
        self.tileComponent = TileComponent(withEntity: self, tileSet: HairLayerEntity.tileSet, offset: 250.0)
        
        addComponent(self.tileComponent)
        
        self.name = "HairLayerEntity"
    }
}

extension HairLayerEntity {
    
    static var resourcesNeedLoading: Bool {
        return atlas == nil
    }
    
    static func loadResourcesWithCompletionHandler(completionHandler: () -> ()) {
        
        atlas = SKTextureAtlas(named: "RPHairLayer")
        atlas.preloadWithCompletionHandler { () -> Void in
            
            tileSet = TileComponent.tileSetFromAtlas(atlas)
            completionHandler()
        }
    }
    
    static func purgeResources() {
        
        atlas = nil
    }
}